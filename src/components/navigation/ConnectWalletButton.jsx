import { useWallet } from '@solana/wallet-adapter-react';
import { WalletModalButton } from '@solana/wallet-adapter-react-ui';
import WalletBalanceDropdown from './WalletBalanceDropdown.jsx';

export default function ConnectWalletButton() {
  const { publicKey, connected } = useWallet();
  const address = publicKey ? publicKey.toBase58() : null;
  const label =
    connected && address
      ? `${address.slice(0, 4)}xxxx${address.slice(-3)}`
      : 'Connect Wallet';

  if (!connected) {
    return (
      <WalletModalButton className="qms-pill">
        {label}
      </WalletModalButton>
    );
  }

  return <WalletBalanceDropdown />;
}
