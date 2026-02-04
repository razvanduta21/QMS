import { AnchorProvider, BN, Program } from '@coral-xyz/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress
} from '@solana/spl-token';
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  Keypair,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import idl from '../idl/qms_mint.json';

// Example: usage in a React/Vite app that already has wallet adapter + connection.
// const provider = new AnchorProvider(connection, wallet, { commitment: 'confirmed' });

export async function mintWithQmsProgram({
  provider,
  mintDraft,
  programId,
  metadata
}: {
  provider: AnchorProvider;
  mintDraft: {
    token: {
      decimals: number;
      supply: string | number;
      mintToAddress: string;
      supplyType: 'fixed' | 'mintable';
    };
    authority: {
      mode: 'simple' | 'advanced';
      authorityType: 'wallet' | 'pda' | 'multisig';
      authorityAddress: string;
      revokeMint: boolean;
      revokeFreeze: boolean;
      updateAuthority: boolean;
      updateAuthorityType: 'wallet' | 'pda' | 'multisig';
      updateAuthorityAddress: string;
    };
  };
  programId: PublicKey;
  metadata?: {
    name: string;
    symbol: string;
    uri: string;
    isMutable: boolean;
  };
}) {
  const program = new Program(idl as any, programId, provider);
  const payer = provider.wallet.publicKey;
  const mintKeypair = Keypair.generate();

  const mintTo = new PublicKey(mintDraft.token.mintToAddress || payer);
  const destinationAta = await getAssociatedTokenAddress(mintKeypair.publicKey, mintTo);

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    programId
  );
  const [programAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from('mint-authority')],
    programId
  );
  const metadataProgramId = new PublicKey(
    'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
  );
  const [metadataPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      metadataProgramId.toBuffer(),
      mintKeypair.publicKey.toBuffer()
    ],
    metadataProgramId
  );

  const finalMintAuthority =
    mintDraft.token.supplyType === 'fixed' || mintDraft.authority.revokeMint
      ? null
      : mintDraft.authority.mode === 'advanced' &&
          mintDraft.authority.authorityType !== 'wallet'
        ? new PublicKey(mintDraft.authority.authorityAddress)
        : payer;

  const finalFreezeAuthority = mintDraft.authority.revokeFreeze
    ? null
    : finalMintAuthority || payer;

  const decimals = Number(mintDraft.token.decimals || 0);
  // Supply must be in base units (raw). Convert from UI supply if needed.
  const initialSupply = new BN(mintDraft.token.supply);

  const baseAccounts = {
    payer,
    config: configPda,
    treasury: new PublicKey('7vs9qn7BMVfRX9APjDP6jTQmX18tK8h5mDugA1Lf47YH'),
    mint: mintKeypair.publicKey,
    programAuthority,
    destinationOwner: mintTo,
    destinationAta,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY
  };

  if (metadata) {
    const updateAuthority = mintDraft.authority.updateAuthority
      ? mintDraft.authority.updateAuthorityType === 'wallet'
        ? payer
        : new PublicKey(mintDraft.authority.updateAuthorityAddress)
      : payer;

    const computeIx = ComputeBudgetProgram.setComputeUnitLimit({ units: 400000 });
    const priceIx = ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1000 });

    await program.methods
      .mintTokenWithMetadata(
        {
          decimals,
          initialSupply,
          mintTo,
          finalMintAuthority,
          finalFreezeAuthority,
          clientRef: null
        },
        {
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadata.uri,
          sellerFeeBasisPoints: 0,
          isMutable: metadata.isMutable,
          updateAuthority
        }
      )
      .preInstructions([computeIx, priceIx])
      .accounts({
        ...baseAccounts,
        metadataPda,
        updateAuthority,
        tokenMetadataProgram: metadataProgramId
      })
      .signers([mintKeypair])
      .rpc();
  } else {
    await program.methods
      .mintToken({
        decimals,
        initialSupply,
        mintTo,
        finalMintAuthority,
        finalFreezeAuthority,
        clientRef: null
      })
      .accounts(baseAccounts)
      .signers([mintKeypair])
      .rpc();
  }
}
