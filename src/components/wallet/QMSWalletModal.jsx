import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

const WALLET_ICON_BG = {
  MathWallet: 'bg-blue-900',
  Ledger: 'bg-blue-900'
};

function WalletRow({ wallet, onSelect }) {
  const isInstalled = wallet.readyState === WalletReadyState.Installed;
  const isWalletConnect = wallet.adapter?.name === 'WalletConnect';
  const iconBg = WALLET_ICON_BG[wallet.adapter?.name] || 'bg-white';

  return (
    <button
      type="button"
      onClick={() => onSelect(wallet.adapter.name)}
      className="flex w-full items-center gap-3 rounded-2xl border border-blue-100 bg-white px-4 py-3 text-left transition hover:border-blue-300 hover:bg-blue-50"
    >
      <span
        className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-blue-100 ${iconBg}`}
      >
        <img src={wallet.adapter.icon} alt="" className="qms-wallet-icon" />
      </span>
      <div className="flex-1">
        <div className="text-sm font-semibold text-blue-700">{wallet.adapter.name}</div>
        <div className="text-[11px] text-slate-500">
          {isInstalled ? 'Installed' : 'Available'}
        </div>
      </div>
      {isWalletConnect ? (
        <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-600">
          QR
        </span>
      ) : null}
    </button>
  );
}

export default function QMSWalletModal() {
  const { wallets, select, connect } = useWallet();
  const { visible, setVisible } = useWalletModal();
  const [portal, setPortal] = useState(null);
  const containerRef = useRef(null);

  const orderedWallets = useMemo(() => {
    const installed = [];
    const other = [];
    for (const wallet of wallets) {
      if (wallet.readyState === WalletReadyState.Installed) {
        installed.push(wallet);
      } else {
        other.push(wallet);
      }
    }
    return installed.length ? [...installed, ...other] : other;
  }, [wallets]);

  useEffect(() => {
    setPortal(document.body);
  }, []);

  useEffect(() => {
    if (!visible) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setVisible(false);
      }
    };

    const { overflow } = window.getComputedStyle(document.body);
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown, false);

    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', handleKeyDown, false);
    };
  }, [setVisible, visible]);

  if (!visible || !portal) {
    return null;
  }

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 px-4 py-6"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close wallet modal"
        className="absolute inset-0"
        onClick={() => setVisible(false)}
      />

      <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold text-blue-700">Connect Wallet</div>
          <button
            type="button"
            onClick={() => setVisible(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-blue-100 text-slate-500 hover:border-blue-200 hover:text-blue-600"
          >
            x
          </button>
        </div>

        <div className="qms-scrollbar mt-4 max-h-80 space-y-3 overflow-y-auto">
          {orderedWallets.map((wallet, index) => (
            <WalletRow
              key={`${wallet.adapter.name}-${index}`}
              wallet={wallet}
              onSelect={(name) => {
                select(name);
                setVisible(false);
                setTimeout(() => {
                  connect().catch(() => {});
                }, 0);
              }}
            />
          ))}
        </div>

        <div className="mt-4 text-center text-xs text-slate-500">
          Need a wallet? <span className="font-semibold text-blue-600">Get started</span>
        </div>
      </div>
    </div>,
    portal
  );
}
