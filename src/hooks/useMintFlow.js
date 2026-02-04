import { useContext } from 'react';
import { MintContext } from '../context/MintContext.jsx';

export function useMintFlow() {
  const ctx = useContext(MintContext);
  if (!ctx) {
    throw new Error('useMintFlow must be used within MintProvider');
  }
  return ctx;
}
