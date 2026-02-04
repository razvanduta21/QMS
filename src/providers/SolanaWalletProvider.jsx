import { useMemo } from 'react';
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import QMSWalletModalProvider from './QMSWalletModalProvider.jsx';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { Coin98WalletAdapter } from '@solana/wallet-adapter-coin98';
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase';
import { LedgerWalletAdapter } from '@solana/wallet-adapter-ledger';
import { MathWalletAdapter } from '@solana/wallet-adapter-mathwallet';
import { TrustWalletAdapter } from '@solana/wallet-adapter-trust';
import { TokenPocketWalletAdapter } from '@solana/wallet-adapter-tokenpocket';
import { SafePalWalletAdapter } from '@solana/wallet-adapter-safepal';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import { GlowWalletAdapter } from '@solana/wallet-adapter-glow';
import { WalletConnectWalletAdapter } from '@solana/wallet-adapter-walletconnect';
import { useSolanaNetwork } from './SolanaNetworkContext.jsx';

export function SolanaWalletProvider({ children }) {
  const { network } = useSolanaNetwork();
  const walletConnectProjectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
  const adapterNetwork =
    network.value === 'mainnet-beta'
      ? WalletAdapterNetwork.Mainnet
      : network.value === 'testnet'
      ? WalletAdapterNetwork.Testnet
      : WalletAdapterNetwork.Devnet;
  const wallets = useMemo(
    () => {
      const items = [
        new PhantomWalletAdapter(),
        new SolflareWalletAdapter({ network: adapterNetwork }),
        new BackpackWalletAdapter(),
        new GlowWalletAdapter({ network: adapterNetwork }),
        new TrustWalletAdapter(),
        new CoinbaseWalletAdapter(),
        new Coin98WalletAdapter(),
        new MathWalletAdapter(),
        new TokenPocketWalletAdapter(),
        new SafePalWalletAdapter(),
        new LedgerWalletAdapter()
      ];

      if (walletConnectProjectId) {
        items.push(
          new WalletConnectWalletAdapter({
            network: adapterNetwork,
            options: { projectId: walletConnectProjectId }
          })
        );
      }

      return items;
    },
    [adapterNetwork, walletConnectProjectId]
  );

  return (
    <ConnectionProvider endpoint={network.endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <QMSWalletModalProvider>{children}</QMSWalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
