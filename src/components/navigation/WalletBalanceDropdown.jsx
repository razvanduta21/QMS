import { useEffect, useMemo, useRef, useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import solanaIcon from '../../assets/icons/solana-token.svg';
import usdtIcon from '../../assets/icons/usdt.svg';
import usdcIcon from '../../assets/icons/usdc.svg';
import bonkIcon from '../../assets/icons/bonk.svg';

const COINGECKO_ID_BY_MINT = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'usd-coin',
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 'tether',
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: 'bonk'
};

const TOKEN_SYMBOL_BY_MINT = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'USDC',
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 'USDT',
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: 'BONK'
};

const TOKEN_ICON_BY_MINT = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: usdcIcon,
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: usdtIcon,
  DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263: bonkIcon
};

const TOKEN_LIST_URL =
  'https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json';
const TOKEN_LIST_FALLBACK_URL =
  'https://cdn.jsdelivr.net/gh/solana-labs/token-list@main/src/tokens/solana.tokenlist.json';
const TOKEN_LIST_CACHE_TTL = 60 * 60 * 1000;

const PRICE_CACHE_TTL = 60_000;
let priceCache = {
  ids: '',
  fetchedAt: 0,
  data: null
};

let tokenListCache = {
  fetchedAt: 0,
  data: null
};

const resolveAppNetworkLabel = (endpoint) => {
  const normalized = (endpoint || '').toLowerCase();
  if (normalized.includes('devnet')) return 'Solana Devnet';
  if (normalized.includes('testnet')) return 'Solana Testnet';
  return 'Solana Mainnet';
};

const formatSol = (value) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 6
  });

const formatTokenAmount = (value) =>
  value.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 6
  });

const formatUsd = (value) => `$${value.toFixed(2)}`;

const fetchPrices = async (ids) => {
  const unique = Array.from(new Set(ids)).filter(Boolean);
  if (unique.length === 0) return {};
  const cacheKey = unique.slice().sort().join(',');
  const now = Date.now();
  if (priceCache.data && priceCache.ids === cacheKey && now - priceCache.fetchedAt < PRICE_CACHE_TTL) {
    return priceCache.data;
  }

  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
      unique.join(',')
    )}&vs_currencies=usd`
  );
  const data = await response.json();
  priceCache = { ids: cacheKey, fetchedAt: now, data };
  return data;
};

const fetchTokenMetadata = async () => {
  const now = Date.now();
  if (tokenListCache.data && now - tokenListCache.fetchedAt < TOKEN_LIST_CACHE_TTL) {
    return tokenListCache.data;
  }

  const loadFrom = async (url) => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Token list request failed: ${response.status}`);
    }
    return response.json();
  };

  let payload;
  try {
    payload = await loadFrom(TOKEN_LIST_URL);
  } catch {
    payload = await loadFrom(TOKEN_LIST_FALLBACK_URL);
  }

  const tokens = payload?.tokens || [];
  const metadata = {};
  tokens.forEach((token) => {
    if (!token?.address) return;
    metadata[token.address] = {
      symbol: token.symbol,
      logoURI: token.logoURI,
      coingeckoId: token.extensions?.coingeckoId
    };
  });

  tokenListCache = { fetchedAt: now, data: metadata };
  return metadata;
};

export default function WalletBalanceDropdown() {
  const { publicKey, connected, disconnect } = useWallet();
  const { connection } = useConnection();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [solBalance, setSolBalance] = useState(0);
  const [tokens, setTokens] = useState([]);
  const [tokenMeta, setTokenMeta] = useState({});
  const [prices, setPrices] = useState({});
  const [error, setError] = useState('');
  const [priceError, setPriceError] = useState('');
  const wrapperRef = useRef(null);

  const appNetworkLabel = resolveAppNetworkLabel(connection?.rpcEndpoint);

  const priceIds = useMemo(() => {
    const ids = new Set(['solana']);
    tokens.forEach((token) => {
      const meta = tokenMeta[token.mint];
      const id = meta?.coingeckoId || COINGECKO_ID_BY_MINT[token.mint];
      if (id) ids.add(id);
    });
    return Array.from(ids);
  }, [tokens, tokenMeta]);

  const priceKey = useMemo(() => priceIds.slice().sort().join(','), [priceIds]);

  const tokenDetails = useMemo(() => {
    return tokens.map((token) => {
      const meta = tokenMeta[token.mint];
      const id = meta?.coingeckoId || COINGECKO_ID_BY_MINT[token.mint];
      const price = id ? prices?.[id]?.usd ?? 0 : 0;
      const priced = Boolean(id && prices?.[id]?.usd);
      const symbol =
        meta?.symbol || TOKEN_SYMBOL_BY_MINT[token.mint] || token.mint.slice(0, 4);
      const icon = meta?.logoURI || TOKEN_ICON_BY_MINT[token.mint] || null;
      const valueUsd = priced ? price * token.amount : 0;
      return {
        ...token,
        symbol,
        icon,
        priceUsd: price,
        priced,
        valueUsd
      };
    });
  }, [tokens, prices]);

  const pricedTokens = useMemo(
    () => tokenDetails.filter((token) => token.priced),
    [tokenDetails]
  );

  const solPrice = prices?.solana?.usd ?? null;
  const solValueUsd = solPrice ? solBalance * solPrice : null;
  const tokenUsdTotal = pricedTokens.reduce((sum, token) => sum + (token.valueUsd || 0), 0);
  const hasTokenPrices = pricedTokens.length > 0;
  const totalUsd = (solValueUsd || 0) + (hasTokenPrices ? tokenUsdTotal : 0);
  const hasAnyPrice = Boolean(solPrice) || hasTokenPrices;

  const fetchPortfolio = async () => {
    if (!publicKey) return;
    setLoading(true);
    setError('');
    try {
      const [lamports, tokenAccounts] = await Promise.all([
        connection.getBalance(publicKey, 'confirmed'),
        connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID })
      ]);

      const parsedTokens = tokenAccounts.value
        .map((account) => account.account?.data?.parsed?.info)
        .map((info) => {
          if (!info?.mint || !info?.tokenAmount) return null;
          const amount =
            info.tokenAmount.uiAmount ??
            Number(info.tokenAmount.amount) / Math.pow(10, info.tokenAmount.decimals || 0);
          return {
            mint: info.mint,
            amount: Number(amount || 0),
            decimals: info.tokenAmount.decimals || 0
          };
        })
        .filter((token) => token && token.amount > 0);

      setSolBalance(lamports / LAMPORTS_PER_SOL);
      setTokens(parsedTokens);
    } catch (err) {
      const message = err?.message || 'Unable to load balance';
      setError(message);
      console.error('Wallet balance error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchTokenMetadata()
      .then((data) => {
        if (!active) return;
        setTokenMeta(data || {});
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!connected || !publicKey) {
      setSolBalance(0);
      setTokens([]);
      setError('');
      return;
    }
    fetchPortfolio();
  }, [connected, publicKey, connection]);

  useEffect(() => {
    if (open && connected && publicKey) {
      fetchPortfolio();
    }
  }, [open, connected, publicKey, connection]);

  useEffect(() => {
    if (!connected) {
      setPrices({});
      setPriceError('');
      return;
    }
    if (!priceKey) return;

    let active = true;
    setPriceError('');
    fetchPrices(priceIds)
      .then((data) => {
        if (!active) return;
        setPrices(data || {});
      })
      .catch((err) => {
        if (!active) return;
        setPriceError(err?.message || 'Unable to load prices');
      });

    return () => {
      active = false;
    };
  }, [connected, priceKey, priceIds]);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!wrapperRef.current || wrapperRef.current.contains(event.target)) return;
      setOpen(false);
    };

    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, []);

  if (!connected) {
    return null;
  }

  const address = publicKey ? publicKey.toBase58() : '';
  const label = address ? `${address.slice(0, 4)}xxxx${address.slice(-3)}` : 'Wallet';

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="qms-pill"
      >
        {label}
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-80 qms-surface p-4">
          <div className="text-xs text-slate-500">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">App Network</div>
            <div className="text-xs font-semibold text-slate-800">{appNetworkLabel}</div>
          </div>

          <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={solanaIcon} alt="Solana" className="h-8 w-8 rounded-lg" />
                <div>
                  <div className="text-xs font-semibold text-slate-800">SOL balance</div>
                  <div className="text-[11px] text-slate-500">
                    {loading ? '...' : `${formatSol(solBalance)} SOL`}
                  </div>
                </div>
              </div>
              <div className="text-right text-xs font-semibold text-slate-800">
                {loading ? '...' : solValueUsd !== null ? formatUsd(solValueUsd) : '-'}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
              <span>Tokens</span>
              <span className="text-[11px] text-slate-400">Token value</span>
            </div>
            <div className="qms-scrollbar mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
              {pricedTokens.length === 0 ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                  {loading ? 'Loading tokens...' : 'No priced tokens found'}
                </div>
              ) : (
                pricedTokens.map((token) => (
                  <div
                    key={token.mint}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      {token.icon ? (
                        <img
                          src={token.icon}
                          alt={token.symbol}
                          className="h-8 w-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-500">
                          {token.symbol.slice(0, 3)}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-semibold text-slate-800">{token.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-800">
                        {formatTokenAmount(token.amount)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatUsd(token.valueUsd)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-3 space-y-1 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-semibold text-slate-700">Token value</span>
              <span className="font-semibold text-slate-800">
                {loading ? '...' : hasTokenPrices ? formatUsd(tokenUsdTotal) : '-'}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-700">
              <span className="font-semibold">Total portfolio value</span>
              <span className="text-sm font-semibold text-slate-900">
                {loading ? '...' : hasAnyPrice ? formatUsd(totalUsd) : '-'}
              </span>
            </div>
          </div>

          {error ? <div className="mt-2 text-[11px] text-red-500">{error}</div> : null}
          {priceError ? <div className="mt-2 text-[11px] text-red-500">{priceError}</div> : null}

          <button
            type="button"
            onClick={() => {
              disconnect();
              setOpen(false);
            }}
            className="mt-4 w-full rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100"
          >
            Disconnect
          </button>
        </div>
      ) : null}
    </div>
  );
}
