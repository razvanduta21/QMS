import { solanaConfig } from '../../config/solana.config.js';

export function getConnection() {
  return {
    rpcUrl: solanaConfig.rpcUrl,
    network: solanaConfig.network
  };
}
