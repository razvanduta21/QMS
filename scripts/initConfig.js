import fs from 'fs';
import os from 'os';
import path from 'path';
import anchorPkg from '@coral-xyz/anchor';
import { Connection, Keypair, PublicKey, SystemProgram } from '@solana/web3.js';

const { AnchorProvider, BN, Program } = anchorPkg;

const DEFAULT_FEE_LAMPORTS = 14_000_000;

const loadEnvFile = () => {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
};

const resolveKeypairPath = () => {
  if (process.env.ANCHOR_WALLET) return process.env.ANCHOR_WALLET;
  if (process.env.SOLANA_WALLET) return process.env.SOLANA_WALLET;
  return path.join(os.homedir(), '.config', 'solana', 'id.json');
};

const loadKeypair = (filePath) => {
  const secret = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return Keypair.fromSecretKey(Uint8Array.from(secret));
};

const getProgramId = () => {
  const fromEnv = process.env.VITE_QMS_PROGRAM_ID;
  if (fromEnv) return fromEnv;
  const idlPath = path.resolve(process.cwd(), 'src', 'idl', 'qms_mint.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
  return idl?.metadata?.address || idl?.address || '';
};

const loadIdl = () => {
  const idlPath = path.resolve(process.cwd(), 'src', 'idl', 'qms_mint.json');
  return JSON.parse(fs.readFileSync(idlPath, 'utf-8'));
};

const main = async () => {
  loadEnvFile();
  const rpcUrl =
    process.env.VITE_SOLANA_RPC ||
    process.env.ANCHOR_PROVIDER_URL ||
    'https://api.devnet.solana.com';
  const programIdValue = getProgramId();
  const treasuryValue = process.env.VITE_QMS_TREASURY;
  const feeLamports = Number(
    process.env.VITE_QMS_FEE_LAMPORTS ||
      process.env.QMS_FEE_LAMPORTS ||
      DEFAULT_FEE_LAMPORTS
  );

  if (!programIdValue) {
    throw new Error('Missing program id (VITE_QMS_PROGRAM_ID).');
  }
  if (!treasuryValue) {
    throw new Error('Missing treasury (VITE_QMS_TREASURY).');
  }

  const keypairPath = resolveKeypairPath();
  const payer = loadKeypair(keypairPath);
  const connection = new Connection(rpcUrl, 'confirmed');
  const wallet = {
    publicKey: payer.publicKey,
    signTransaction: async (tx) => {
      tx.partialSign(payer);
      return tx;
    },
    signAllTransactions: async (txs) =>
      txs.map((tx) => {
        tx.partialSign(payer);
        return tx;
      })
  };

  const provider = new AnchorProvider(connection, wallet, {
    commitment: 'confirmed'
  });
  const idl = loadIdl();
  const programId = new PublicKey(programIdValue);
  const program = new Program(idl, programId, provider);

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    programId
  );

  const treasury = new PublicKey(treasuryValue);
  const fee = new BN(feeLamports);

  try {
    await program.account.config.fetch(configPda);
    console.log('Config PDA already initialized:', configPda.toBase58());
    return;
  } catch {
    // Not initialized, continue.
  }

  const sig = await program.methods
    .initializeConfig(treasury, fee)
    .accounts({
      admin: payer.publicKey,
      config: configPda,
      systemProgram: SystemProgram.programId
    })
    .signers([payer])
    .rpc();

  console.log('Config initialized. Signature:', sig);
  console.log('Config PDA:', configPda.toBase58());
};

main().catch((error) => {
  console.error('Failed to initialize config:', error.message || error);
  process.exit(1);
});
