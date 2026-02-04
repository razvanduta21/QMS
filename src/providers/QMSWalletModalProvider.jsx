import { useState } from 'react';
import { WalletModalContext } from '@solana/wallet-adapter-react-ui';
import QMSWalletModal from '../components/wallet/QMSWalletModal.jsx';

export default function QMSWalletModalProvider({ children }) {
  const [visible, setVisible] = useState(false);

  return (
    <WalletModalContext.Provider value={{ visible, setVisible }}>
      {children}
      <QMSWalletModal />
    </WalletModalContext.Provider>
  );
}
