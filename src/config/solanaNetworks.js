const MAINNET_RPC =
  import.meta.env.VITE_SOLANA_MAINNET_RPC || 'https://api.mainnet-beta.solana.com';
const DEVNET_RPC =
  import.meta.env.VITE_SOLANA_DEVNET_RPC || 'https://api.devnet.solana.com';
const TESTNET_RPC =
  import.meta.env.VITE_SOLANA_TESTNET_RPC || 'https://api.testnet.solana.com';

export const SOLANA_NETWORKS = {
  mainnet: {
    label: 'Solana Mainnet',
    value: 'mainnet-beta',
    endpoint: MAINNET_RPC
  },
  devnet: {
    label: 'Solana Devnet',
    value: 'devnet',
    endpoint: DEVNET_RPC
  },
  testnet: {
    label: 'Solana Testnet',
    value: 'testnet',
    endpoint: TESTNET_RPC
  }
};
