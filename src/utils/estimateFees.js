import { feesConfig } from '../config/fees.config.js';

export function estimateFees() {
  return feesConfig.qmsFeeBps / 10000 + feesConfig.rentEstimateSol + feesConfig.txEstimateSol;
}
