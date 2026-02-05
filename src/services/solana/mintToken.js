import { AnchorProvider, BN, Program } from '@coral-xyz/anchor';
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress
} from '@solana/spl-token';
import {
  ComputeBudgetProgram,
  Keypair,
  PublicKey,
  SystemProgram,
  SYSVAR_RENT_PUBKEY
} from '@solana/web3.js';
import idl from '../../idl/qms_mint.json';

const DEFAULT_PROGRAM_ID = idl?.metadata?.address || idl?.address || '';
const QMS_PROGRAM_ID = import.meta.env.VITE_QMS_PROGRAM_ID || '';
const QMS_TREASURY =
  import.meta.env.VITE_QMS_TREASURY ||
  '7vs9qn7BMVfRX9APjDP6jTQmX18tK8h5mDugA1Lf47YH';
const TOKEN_METADATA_PROGRAM_ID =
  import.meta.env.VITE_TOKEN_METADATA_PROGRAM_ID ||
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s';

const isLikelyPubkeyString = (value) =>
  typeof value === 'string' && value.length >= 32 && value.length <= 64;

const LOGO_CONTENT_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const parsePublicKey = (value, label) => {
  if (!value) {
    throw new Error(`${label} is required.`);
  }
  try {
    return new PublicKey(value);
  } catch (error) {
    throw new Error(`${label} is invalid.`);
  }
};

const parseAmountToBaseUnits = (value, decimals) => {
  const sanitized = String(value || '')
    .replace(/,/g, '')
    .trim();
  if (!sanitized) return 0n;
  const [whole, fraction = ''] = sanitized.split('.');
  const padded = (fraction + '0'.repeat(decimals)).slice(0, decimals);
  const wholePart = whole ? BigInt(whole) : 0n;
  const fractionPart = padded ? BigInt(padded) : 0n;
  const base = 10n ** BigInt(decimals);
  return wholePart * base + fractionPart;
};

const dataUrlToBlob = (dataUrl) => {
  if (!dataUrl) return null;
  const [header, base64] = dataUrl.split(',');
  const match = header.match(/data:(.*?);base64/);
  const contentType = match ? match[1] : 'application/octet-stream';
  const binary = atob(base64 || '');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: contentType });
};

const META_API_BASE = import.meta.env.VITE_META_API_BASE || '';

const requestPresign = async ({ mint, kind, contentType, contentLength }) => {
  if (!META_API_BASE) {
    throw new Error(
      'Metadata upload server not configured. Set VITE_META_API_BASE or switch to Off-chain metadata.'
    );
  }
  const base = META_API_BASE.replace(/\/$/, '');
  const response = await fetch(`${base}/api/meta/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mint, kind, contentType, contentLength })
  });
  if (!response.ok) {
    throw new Error('Failed to get upload URL.');
  }
  return response.json();
};

const uploadToPresignedUrl = async ({ uploadUrl, body, contentType }) => {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType
    },
    body
  });
  if (!response.ok) {
    throw new Error('Upload failed.');
  }
};

const buildMetadataJson = ({ mintDraft, imageUrl }) => {
  const { token, metadata } = mintDraft;
  const attributes = [];
  if (metadata.twitter) {
    attributes.push({ trait_type: 'twitter', value: metadata.twitter });
  }
  if (metadata.discord) {
    attributes.push({ trait_type: 'discord', value: metadata.discord });
  }
  return {
    name: token.name || 'QMS Token',
    symbol: (token.symbol || 'QMS').toUpperCase(),
    description: metadata.description || '',
    image: imageUrl || '',
    external_url: metadata.website || '',
    attributes
  };
};

const buildProgramAuthorities = (mintDraft, payer) => {
  const { token, authority, metadata } = mintDraft;
  const isFixed = token.supplyType === 'fixed';
  const isAdvanced = authority.mode === 'advanced';

  const resolveAuthority = () => {
    if (!isAdvanced) return payer;
    if (authority.authorityType === 'wallet') return payer;
    if (!authority.authorityAddress) {
      throw new Error('Authority address is required.');
    }
    return parsePublicKey(authority.authorityAddress, 'Authority address');
  };

  const finalMintAuthority =
    isFixed || authority.revokeMint ? null : resolveAuthority();

  const finalFreezeAuthority = authority.revokeFreeze
    ? null
    : resolveAuthority();

  const updateAuthority = metadata.mode === 'onchain'
    ? authority.updateAuthority
      ? authority.updateAuthorityType === 'wallet'
        ? payer
        : authority.updateAuthorityAddress
          ? parsePublicKey(authority.updateAuthorityAddress, 'Update authority address')
          : (() => {
            throw new Error('Update authority address is required.');
          })()
      : payer
    : payer;

  const isMutable = isFixed ? false : true;

  return {
    finalMintAuthority,
    finalFreezeAuthority,
    updateAuthority,
    isMutable
  };
};

const uploadMetadataIfNeeded = async ({ mintDraft, mintPubkey }) => {
  if (mintDraft.metadata.mode !== 'onchain') {
    return { metadataUri: null };
  }

  const mint = mintPubkey.toBase58();
  let imageUrl = '';

  if (mintDraft.metadata.logoDataUrl) {
    const logoBlob = dataUrlToBlob(mintDraft.metadata.logoDataUrl);
    const contentType = logoBlob?.type || 'image/png';
    if (!LOGO_CONTENT_TYPES.includes(contentType)) {
      throw new Error('Unsupported logo format.');
    }
    const logoPresign = await requestPresign({
      mint,
      kind: 'logo',
      contentType,
      contentLength: logoBlob.size
    });
    await uploadToPresignedUrl({
      uploadUrl: logoPresign.uploadUrl,
      body: logoBlob,
      contentType
    });
    imageUrl = logoPresign.publicUrl;
  }

  const metadataJson = buildMetadataJson({ mintDraft, imageUrl });
  const metadataBlob = new Blob([JSON.stringify(metadataJson)], {
    type: 'application/json'
  });
  const jsonPresign = await requestPresign({
    mint,
    kind: 'json',
    contentType: 'application/json',
    contentLength: metadataBlob.size
  });

  await uploadToPresignedUrl({
    uploadUrl: jsonPresign.uploadUrl,
    body: metadataBlob,
    contentType: 'application/json'
  });

  return { metadataUri: jsonPresign.publicUrl };
};

export async function mintToken(mintDraft, { connection, wallet }) {
  if (!connection) throw new Error('Missing connection.');
  const payerSource = wallet?.publicKey ?? wallet?.adapter?.publicKey;
  if (!payerSource) throw new Error('Wallet not connected.');
  const programIdValue = isLikelyPubkeyString(QMS_PROGRAM_ID)
    ? QMS_PROGRAM_ID
    : DEFAULT_PROGRAM_ID;
  if (!isLikelyPubkeyString(programIdValue)) {
    throw new Error('Missing QMS program id.');
  }

  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed'
  });
  const programId = parsePublicKey(programIdValue, 'QMS program id');
  const treasuryKey = parsePublicKey(QMS_TREASURY, 'QMS treasury');
  const metadataProgramKey = parsePublicKey(
    TOKEN_METADATA_PROGRAM_ID,
    'Token metadata program id'
  );
  const program = new Program(idl, programId, provider);

  const mintKeypair = Keypair.generate();
  const payer = payerSource instanceof PublicKey ? payerSource : new PublicKey(payerSource);
  const mintTo = mintDraft.token.mintToAddress
    ? parsePublicKey(mintDraft.token.mintToAddress, 'Mint-to address')
    : payer;
  const destinationAta = await getAssociatedTokenAddress(
    mintKeypair.publicKey,
    mintTo,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    program.programId
  );
  const [programAuthority] = PublicKey.findProgramAddressSync(
    [Buffer.from('mint-authority')],
    program.programId
  );
  const [metadataPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('metadata'),
      metadataProgramKey.toBuffer(),
      mintKeypair.publicKey.toBuffer()
    ],
    metadataProgramKey
  );

  const decimals = Number(mintDraft.token.decimals || 0);
  const initialSupply = new BN(
    parseAmountToBaseUnits(mintDraft.token.supply, decimals).toString()
  );

  const {
    finalMintAuthority,
    finalFreezeAuthority,
    updateAuthority,
    isMutable
  } = buildProgramAuthorities(mintDraft, payer);

  const { metadataUri } = await uploadMetadataIfNeeded({
    mintDraft,
    mintPubkey: mintKeypair.publicKey
  });

  const accounts = {
    payer,
    config: configPda,
    treasury: treasuryKey,
    mint: mintKeypair.publicKey,
    programAuthority,
    destinationOwner: mintTo,
    destinationAta,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
    systemProgram: SystemProgram.programId,
    rent: SYSVAR_RENT_PUBKEY
  };

  if (mintDraft.metadata.mode === 'onchain') {
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
          name: mintDraft.token.name || 'QMS Token',
          symbol: (mintDraft.token.symbol || 'QMS').toUpperCase(),
          uri: metadataUri || '',
          sellerFeeBasisPoints: 0,
          isMutable,
          updateAuthority
        }
      )
      .preInstructions([computeIx, priceIx])
      .accounts({
        ...accounts,
        metadataPda,
        updateAuthority,
        tokenMetadataProgram: metadataProgramKey
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
      .accounts(accounts)
      .signers([mintKeypair])
      .rpc();
  }

  return {
    mint: mintKeypair.publicKey.toBase58(),
    ata: destinationAta.toBase58(),
    metadataUri: metadataUri || null
  };
}
