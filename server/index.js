import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Connection, PublicKey, clusterApiUrl, LAMPORTS_PER_SOL } from '@solana/web3.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  PUBLIC_CDN_BASE_URL,
  DEVNET_RPC,
  TESTNET_RPC
} = process.env;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  console.warn('Missing R2 env vars. Presign endpoint will fail until configured.');
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ACCOUNT_ID
    ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : undefined,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || ''
  }
});

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_JSON_BYTES = 50 * 1024;
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

const resolveKeyForUpload = ({ mint, kind, contentType }) => {
  if (kind === 'logo') {
    const ext =
      contentType === 'image/png'
        ? 'png'
        : contentType === 'image/jpeg'
          ? 'jpg'
          : contentType === 'image/webp'
            ? 'webp'
            : 'bin';
    return `logos/${mint}.${ext}`;
  }
  return `meta/${mint}.json`;
};

const resolvePublicUrl = (key) => {
  const base = (PUBLIC_CDN_BASE_URL || '').replace(/\/$/, '');
  if (base) {
    return `${base}/${key}`;
  }
  if (!R2_ACCOUNT_ID || !R2_BUCKET) return '';
  return `https://${R2_BUCKET}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
};

app.post('/api/meta/presign', async (req, res) => {
  try {
    const { mint, kind, contentType, contentLength } = req.body || {};
    if (!mint || !kind || !contentType) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    if (kind !== 'logo' && kind !== 'json') {
      return res.status(400).json({ error: 'Invalid kind.' });
    }
    if (kind === 'logo' && !ALLOWED_LOGO_TYPES.includes(contentType)) {
      return res.status(400).json({ error: 'Unsupported logo content type.' });
    }
    if (kind === 'json' && contentType !== 'application/json') {
      return res.status(400).json({ error: 'Invalid JSON content type.' });
    }
    if (typeof contentLength === 'number') {
      const limit = kind === 'logo' ? MAX_LOGO_BYTES : MAX_JSON_BYTES;
      if (contentLength > limit) {
        return res.status(400).json({ error: 'File too large.' });
      }
    }

    const key = resolveKeyForUpload({ mint, kind, contentType });
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType
    });
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 * 10 });
    const publicUrl = resolvePublicUrl(key);

    return res.json({ uploadUrl, publicUrl });
  } catch (error) {
    console.error('Presign error:', error);
    return res.status(500).json({ error: 'Failed to generate presign URL.' });
  }
});

const resolveRpcEndpoint = (network) => {
  if (network === 'devnet') return DEVNET_RPC || clusterApiUrl('devnet');
  if (network === 'testnet') return TESTNET_RPC || clusterApiUrl('testnet');
  return null;
};

app.post('/api/airdrop', async (req, res) => {
  try {
    const { address, network } = req.body || {};
    if (!address || !network) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    if (network !== 'devnet' && network !== 'testnet') {
      return res.status(400).json({ error: 'Airdrop is available only on devnet/testnet.' });
    }
    let recipient;
    try {
      recipient = new PublicKey(address);
    } catch {
      return res.status(400).json({ error: 'Invalid wallet address.' });
    }

    const endpoint = resolveRpcEndpoint(network);
    if (!endpoint) {
      return res.status(500).json({ error: 'RPC endpoint not configured.' });
    }

    const connection = new Connection(endpoint, 'confirmed');
    const signature = await connection.requestAirdrop(recipient, LAMPORTS_PER_SOL);
    await connection.confirmTransaction(signature, 'confirmed');
    return res.json({ signature });
  } catch (error) {
    console.error('Airdrop error:', error);
    return res.status(500).json({ error: 'Airdrop failed.' });
  }
});

app.listen(8787, () => {
  console.log('QMS meta server running on http://localhost:8787');
});
