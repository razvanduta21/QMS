import { useMemo } from 'react';
import { WalletReadyState } from '@solana/wallet-adapter-base';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import WalletBalanceDropdown from './WalletBalanceDropdown.jsx';

const MOBILE_WALLET_PRIORITY = [
  'Phantom',
  'Solflare',
  'Backpack',
  'Glow',
  'Coinbase Wallet',
  'Trust Wallet',
  'Coin98',
  'MathWallet',
  'TokenPocket',
  'SafePal',
  'WalletConnect'
];

const isMobileDevice = () => {
  if (typeof navigator === 'undefined') return false;
  if (navigator.userAgentData?.mobile) return true;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '');
};

export default function ConnectWalletButton() {
  const { publicKey, connected, wallets, select, connect } = useWallet();
  const { setVisible } = useWalletModal();
  const preferredWallet = useMemo(() => {
    const available = wallets.filter(
      (item) =>
        item.readyState === WalletReadyState.Installed ||
        item.readyState === WalletReadyState.Loadable
    );
    if (!available.length) return null;
    const ordered = [...available].sort((a, b) => {
      const aIndex = MOBILE_WALLET_PRIORITY.indexOf(a.adapter.name);
      const bIndex = MOBILE_WALLET_PRIORITY.indexOf(b.adapter.name);
      const safeA = aIndex === -1 ? 999 : aIndex;
      const safeB = bIndex === -1 ? 999 : bIndex;
      return safeA - safeB;
    });
    return ordered[0];
  }, [wallets]);

  const handleClick = async () => {
    if (isMobileDevice() && preferredWallet) {
      try {
        select(preferredWallet.adapter.name);
        await connect();
        return;
      } catch {
        setVisible(true);
        return;
      }
    }
    setVisible(true);
  };
  const address = publicKey ? publicKey.toBase58() : null;
  const label =
    connected && address
      ? `${address.slice(0, 4)}xxxx${address.slice(-3)}`
      : 'Connect Wallet';

  if (!connected) {
    return (
      <button type="button" onClick={handleClick} className="qms-pill">
        {label}
      </button>
    );
  }

  return <WalletBalanceDropdown />;
}
