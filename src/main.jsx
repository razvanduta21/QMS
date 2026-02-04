import React from 'react';
import ReactDOM from 'react-dom/client';
import { Buffer } from 'buffer';
import process from 'process/browser';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { SolanaNetworkProvider } from './providers/SolanaNetworkContext.jsx';
import { SolanaWalletProvider } from './providers/SolanaWalletProvider.jsx';
import '@solana/wallet-adapter-react-ui/styles.css';
import './index.css';

if (!globalThis.Buffer) {
  globalThis.Buffer = Buffer;
}
if (!globalThis.process) {
  globalThis.process = process;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <SolanaNetworkProvider>
        <SolanaWalletProvider>
          <App />
        </SolanaWalletProvider>
      </SolanaNetworkProvider>
    </BrowserRouter>
  </React.StrictMode>
);
