import { AwsClient } from 'aws4fetch';

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MAX_JSON_BYTES = 50 * 1024;
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const ALLOWED_ORIGINS = ['https://mintqms.xyz', 'https://www.mintqms.xyz', 'http://localhost:5173'];

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(headers)
    }
  });

const corsHeaders = (headers = {}) => {
  const origin = headers.origin || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
};

const resolveOrigin = (request) => {
  const origin = request.headers.get('Origin') || '';
  if (!origin) return '*';
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  return '*';
};

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

const resolvePublicUrl = (env, key) => {
  const base = (env.PUBLIC_CDN_BASE_URL || '').replace(/\/$/, '');
  if (base) return `${base}/${key}`;
  if (!env.R2_ACCOUNT_ID || !env.R2_BUCKET) return '';
  return `https://${env.R2_BUCKET}.${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
};

const getS3Endpoint = (env) =>
  env.R2_S3_ENDPOINT || (env.R2_ACCOUNT_ID ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '');

const getRpcEndpoint = (env, network) => {
  if (network === 'devnet') return env.DEVNET_RPC || 'https://api.devnet.solana.com';
  if (network === 'testnet') return env.TESTNET_RPC || 'https://api.testnet.solana.com';
  return null;
};

const requestAirdrop = async (endpoint, address) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'airdrop',
      method: 'requestAirdrop',
      params: [address, 1_000_000_000]
    })
  });
  const data = await response.json();
  if (!response.ok || data?.error) {
    const message =
      data?.error?.message ||
      data?.error?.data?.logs?.join(' ') ||
      `RPC error ${response.status}`;
    throw new Error(message);
  }
  return data.result;
};

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders({ origin: resolveOrigin(request) }) });
    }

    const url = new URL(request.url);
    const origin = resolveOrigin(request);

    if (url.pathname === '/api/meta/presign' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { mint, kind, contentType, contentLength } = body || {};

        if (!mint || !kind || !contentType) {
          return json({ error: 'Missing required fields.' }, 400, { origin });
        }
        if (kind !== 'logo' && kind !== 'json') {
          return json({ error: 'Invalid kind.' }, 400, { origin });
        }
        if (kind === 'logo' && !ALLOWED_LOGO_TYPES.includes(contentType)) {
          return json({ error: 'Unsupported logo content type.' }, 400, { origin });
        }
        if (kind === 'json' && contentType !== 'application/json') {
          return json({ error: 'Invalid JSON content type.' }, 400, { origin });
        }

        if (typeof contentLength === 'number') {
          const limit = kind === 'logo' ? MAX_LOGO_BYTES : MAX_JSON_BYTES;
          if (contentLength > limit) {
            return json({ error: 'File too large.' }, 400, { origin });
          }
        }

        const endpoint = getS3Endpoint(env);
        if (!endpoint || !env.R2_BUCKET || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
          return json({ error: 'R2 not configured.' }, 500, { origin });
        }

        const key = resolveKeyForUpload({ mint, kind, contentType });
        const aws = new AwsClient({
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
          service: 's3',
          region: 'auto'
        });
        const urlToSign = new URL(`${endpoint.replace(/\/$/, '')}/${env.R2_BUCKET}/${key}`);
        urlToSign.searchParams.set('X-Amz-Expires', '600');

        const signed = await aws.sign(urlToSign.toString(), {
          method: 'PUT',
          headers: {
            'content-type': contentType
          }
        });

        const publicUrl = resolvePublicUrl(env, key);
        return json({ uploadUrl: signed.url, publicUrl }, 200, { origin });
      } catch (err) {
        return json({ error: err?.message || 'Failed to generate presign URL.' }, 500, { origin });
      }
    }

    if (url.pathname === '/api/airdrop' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { address, network } = body || {};
        if (!address || !network) {
          return json({ error: 'Missing required fields.' }, 400, { origin });
        }
        if (network !== 'devnet' && network !== 'testnet') {
          return json({ error: 'Airdrop is available only on devnet/testnet.' }, 400, { origin });
        }
        const endpoint = getRpcEndpoint(env, network);
        if (!endpoint) {
          return json({ error: 'RPC endpoint not configured.' }, 500, { origin });
        }

        const signature = await requestAirdrop(endpoint, address);
        return json({ signature }, 200, { origin });
      } catch (err) {
        return json({ error: err?.message || 'Airdrop failed.' }, 500, { origin });
      }
    }

    if (url.pathname === '/api/prices' && request.method === 'GET') {
      try {
        const ids = url.searchParams.get('ids');
        if (!ids) {
          return json({ error: 'Missing ids.' }, 400, { origin });
        }
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
            ids
          )}&vs_currencies=usd`
        );
        const data = await response.json();
        if (!response.ok) {
          return json({ error: 'Price lookup failed.' }, 502, { origin });
        }
        return json(data, 200, { origin });
      } catch (err) {
        return json({ error: err?.message || 'Price lookup failed.' }, 500, { origin });
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders({ origin: resolveOrigin(request) }) });
  }
};
