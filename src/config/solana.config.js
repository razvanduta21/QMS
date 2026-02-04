export const solanaConfig = {
  network: import.meta.env.VITE_SOLANA_NETWORK || 'devnet',
  rpcUrl: import.meta.env.VITE_SOLANA_RPC || 'https://api.devnet.solana.com',
  explorers: {
    solscan: 'https://solscan.io',
    explorer: 'https://explorer.solana.com'
  }
};
