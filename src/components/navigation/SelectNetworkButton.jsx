import { useEffect, useRef, useState } from 'react';
import { useSolanaNetwork } from '../../providers/SolanaNetworkContext.jsx';
import { SOLANA_NETWORKS } from '../../config/solanaNetworks.js';

const NETWORK_BADGES = {
  mainnet: { label: 'Mainnet', dot: 'bg-emerald-400' },
  devnet: { label: 'Devnet', dot: 'bg-orange-400' },
  testnet: { label: 'Testnet', dot: 'bg-purple-400' }
};

export default function SelectNetworkButton() {
  const { networkKey, setNetworkKey } = useSolanaNetwork();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  const badge = NETWORK_BADGES[networkKey] || NETWORK_BADGES.mainnet;
  const networks = Object.keys(SOLANA_NETWORKS);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!wrapperRef.current || wrapperRef.current.contains(event.target)) return;
      setOpen(false);
    };

    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="qms-pill"
      >
        <span className={`h-2 w-2 rounded-full ${badge.dot} animate-pulse`} />
        <span>{badge.label}</span>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-44 rounded-2xl border border-blue-100 bg-white p-2 shadow-lg">
          <div className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            App Network
          </div>
          {networks.map((key) => {
            const itemBadge = NETWORK_BADGES[key] || NETWORK_BADGES.mainnet;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setNetworkKey(key);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs transition ${
                  key === networkKey
                    ? 'bg-blue-50 font-semibold text-blue-600'
                    : 'text-slate-700 hover:bg-blue-50'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${itemBadge.dot}`} />
                <span className="flex-1">{itemBadge.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
