import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress
} from '@solana/spl-token';
import { SystemProgram, Keypair, PublicKey, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';

// Optional tests (run with `anchor test` in a proper Anchor workspace).
describe('qms_mint', () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.QmsMint as Program;
  const payer = provider.wallet.publicKey;

  it('mints and pays fee atomically', async () => {
    const mintKeypair = Keypair.generate();
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      program.programId
    );
    const [programAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('mint-authority')],
      program.programId
    );

    const mintTo = payer;
    const destinationAta = await getAssociatedTokenAddress(mintKeypair.publicKey, mintTo);

    await program.methods
      .mintToken({
        decimals: 9,
        initialSupply: new anchor.BN('1000000000'),
        mintTo,
        finalMintAuthority: null,
        finalFreezeAuthority: null,
        clientRef: null
      })
      .accounts({
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
      })
      .signers([mintKeypair])
      .rpc();
  });

  it.skip('mints with metadata and creates metadata PDA', async () => {
    const mintKeypair = Keypair.generate();
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      program.programId
    );
    const [programAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('mint-authority')],
      program.programId
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

    const mintTo = payer;
    const destinationAta = await getAssociatedTokenAddress(mintKeypair.publicKey, mintTo);

    await program.methods
      .mintTokenWithMetadata(
        {
          decimals: 9,
          initialSupply: new anchor.BN('1000000000'),
          mintTo,
          finalMintAuthority: null,
          finalFreezeAuthority: null,
          clientRef: null
        },
        {
          name: 'QMS Token',
          symbol: 'QMS',
          uri: `https://cdn.mintqms.xyz/meta/${mintKeypair.publicKey.toBase58()}.json`,
          sellerFeeBasisPoints: 0,
          isMutable: false,
          updateAuthority: payer
        }
      )
      .accounts({
        payer,
        config: configPda,
        treasury: new PublicKey('7vs9qn7BMVfRX9APjDP6jTQmX18tK8h5mDugA1Lf47YH'),
        mint: mintKeypair.publicKey,
        programAuthority,
        destinationOwner: mintTo,
        destinationAta,
        metadataPda,
        updateAuthority: payer,
        tokenMetadataProgram: metadataProgramId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      })
      .signers([mintKeypair])
      .rpc();
  });

  it.skip('fails with invalid metadata PDA', async () => {
    const mintKeypair = Keypair.generate();
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      program.programId
    );
    const [programAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from('mint-authority')],
      program.programId
    );
    const metadataProgramId = new PublicKey(
      'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s'
    );

    const mintTo = payer;
    const destinationAta = await getAssociatedTokenAddress(mintKeypair.publicKey, mintTo);
    const fakeMetadataPda = Keypair.generate().publicKey;

    await program.methods
      .mintTokenWithMetadata(
        {
          decimals: 9,
          initialSupply: new anchor.BN('1000000000'),
          mintTo,
          finalMintAuthority: null,
          finalFreezeAuthority: null,
          clientRef: null
        },
        {
          name: 'QMS Token',
          symbol: 'QMS',
          uri: `https://cdn.mintqms.xyz/meta/${mintKeypair.publicKey.toBase58()}.json`,
          sellerFeeBasisPoints: 0,
          isMutable: false,
          updateAuthority: payer
        }
      )
      .accounts({
        payer,
        config: configPda,
        treasury: new PublicKey('7vs9qn7BMVfRX9APjDP6jTQmX18tK8h5mDugA1Lf47YH'),
        mint: mintKeypair.publicKey,
        programAuthority,
        destinationOwner: mintTo,
        destinationAta,
        metadataPda: fakeMetadataPda,
        updateAuthority: payer,
        tokenMetadataProgram: metadataProgramId,
        tokenProgram: TOKEN_PROGRAM_ID,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: SYSVAR_RENT_PUBKEY
      })
      .signers([mintKeypair])
      .rpc();
  });
});
