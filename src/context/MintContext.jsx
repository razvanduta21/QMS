import { createContext, useMemo, useState } from 'react';

export const MintContext = createContext(null);

export const DEFAULT_MINT_DRAFT = {
  token: {
    name: '',
    symbol: '',
    supply: '',
    decimals: 9,
    mintToAddress: '',
    supplyType: 'fixed'
  },
  authority: {
    mode: 'simple',
    revokeMint: true,
    revokeFreeze: true,
    updateAuthority: false,
    authorityType: 'wallet',
    authorityAddress: '',
    updateAuthorityType: 'wallet',
    updateAuthorityAddress: ''
  },
  metadata: {
    mode: 'offchain',
    logoDataUrl: '',
    logoFileName: '',
    cropToSquare: true,
    description: '',
    website: '',
    twitter: '',
    discord: ''
  },
  confirmations: {
    revokeMintAcknowledged: false
  }
};

export function MintProvider({ children }) {
  const [mintDraft, setMintDraft] = useState(DEFAULT_MINT_DRAFT);
  const [step, setStep] = useState(1);
  const [status, setStatus] = useState('idle');

  const reset = () => {
    setMintDraft(DEFAULT_MINT_DRAFT);
    setStep(1);
    setStatus('idle');
  };

  const value = useMemo(
    () => ({
      mintDraft,
      setMintDraft,
      step,
      setStep,
      status,
      setStatus,
      reset
    }),
    [mintDraft, step, status]
  );

  return <MintContext.Provider value={value}>{children}</MintContext.Provider>;
}
