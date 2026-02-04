import { createContext, useContext, useState } from 'react';
import { SOLANA_NETWORKS } from '../config/solanaNetworks.js';

const SolanaNetworkContext = createContext(null);

export function SolanaNetworkProvider({ children }) {
  const [networkKey, setNetworkKey] = useState('mainnet');
  const envRpc = import.meta.env.VITE_SOLANA_RPC;
  const envRpcMainnet = import.meta.env.VITE_SOLANA_RPC_MAINNET;
  const envRpcDevnet = import.meta.env.VITE_SOLANA_RPC_DEVNET;
  const envRpcTestnet = import.meta.env.VITE_SOLANA_RPC_TESTNET;
  const endpointOverride =
    (networkKey === 'mainnet' && envRpcMainnet) ||
    (networkKey === 'devnet' && envRpcDevnet) ||
    (networkKey === 'testnet' && envRpcTestnet) ||
    envRpc;
  const baseNetwork = SOLANA_NETWORKS[networkKey];
  const network = {
    ...baseNetwork,
    endpoint: endpointOverride || baseNetwork.endpoint
  };

  return (
    <SolanaNetworkContext.Provider value={{ networkKey, setNetworkKey, network }}>
      {children}
    </SolanaNetworkContext.Provider>
  );
}

export function useSolanaNetwork() {
  const ctx = useContext(SolanaNetworkContext);
  if (!ctx) {
    throw new Error('useSolanaNetwork must be used within SolanaNetworkProvider');
  }
  return ctx;
}
