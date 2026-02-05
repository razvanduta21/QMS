import { NavLink } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction
} from '@solana/web3.js';
import { SOLANA_NETWORKS } from '../../config/solanaNetworks.js';
import { useSolanaNetwork } from '../../providers/SolanaNetworkContext.jsx';

export default function SFPPanel() {
  const { publicKey, connected, sendTransaction, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const { networkKey } = useSolanaNetwork();
  const [open, setOpen] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [airdropAddress, setAirdropAddress] = useState('');
  const [airdropNetwork, setAirdropNetwork] = useState('devnet');
  const [airdropStatus, setAirdropStatus] = useState('');
  const wrapperRef = useRef(null);

  const treasuryKey = useMemo(() => {
    const raw = import.meta.env.VITE_QMS_TREASURY;
    if (!raw) return null;
    try {
      return new PublicKey(raw);
    } catch {
      return null;
    }
  }, []);

  const presets = [0.01, 0.1, 1, 10];
  const baseApi = (import.meta.env.VITE_META_API_BASE || '').replace(/\/$/, '');
  const mainnetEndpoint =
    SOLANA_NETWORKS?.mainnet?.endpoint || 'https://api.mainnet-beta.solana.com';
  const isDefaultMainnetRpc = mainnetEndpoint.includes('api.mainnet-beta.solana.com');
  const mainnetConnection = useMemo(
    () => new Connection(mainnetEndpoint, 'confirmed'),
    [mainnetEndpoint]
  );

  useEffect(() => {
    const handleOutside = (event) => {
      if (!wrapperRef.current || wrapperRef.current.contains(event.target)) return;
      setOpen(false);
      setCustomMode(false);
      setError('');
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, []);

  const handleDonate = async (amount) => {
    if (!connected || !publicKey || !wallet?.adapter?.connected) {
      setVisible(true);
      return;
    }
    if (networkKey !== 'mainnet') {
      setError('Donations are processed on Solana Mainnet only.');
      return;
    }
    if (isDefaultMainnetRpc) {
      setError(
        'Mainnet RPC blocked. Set VITE_SOLANA_MAINNET_RPC to a private endpoint.'
      );
      return;
    }
    if (!treasuryKey) {
      setError('Treasury wallet is not configured.');
      return;
    }
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount.');
      return;
    }

    setError('');
    setSuccess('');
    setIsSending(true);
    try {
      const lamports = Math.round(amount * LAMPORTS_PER_SOL);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: treasuryKey,
          lamports
        })
      );
      const signature = await sendTransaction(transaction, mainnetConnection);
      await mainnetConnection.confirmTransaction(signature, 'confirmed');
      setSuccess('Donation sent.');
      setOpen(false);
      setCustomMode(false);
      setCustomAmount('');
    } catch (err) {
      const message = err?.message || 'Transaction failed.';
      if (message.includes('403') || message.toLowerCase().includes('access forbidden')) {
        setError('Mainnet RPC access forbidden. Set VITE_SOLANA_MAINNET_RPC.');
        return;
      }
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleAirdrop = async () => {
    if (!airdropAddress.trim()) {
      setAirdropStatus('Enter a wallet address.');
      return;
    }
    setAirdropStatus('Requesting airdrop...');
    try {
      const response = await fetch(`${baseApi}/api/airdrop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: airdropAddress.trim(),
          network: airdropNetwork
        })
      });
      const data = await response.json();
      if (!response.ok) {
        setAirdropStatus(data?.error || 'Airdrop failed.');
        return;
      }
      setAirdropStatus('Airdrop sent. Check your wallet.');
    } catch (err) {
      setAirdropStatus(err?.message || 'Airdrop failed.');
    }
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 md:p-6 shadow-sm">
      <h3 className="text-base md:text-lg font-semibold text-slate-900">
        System Funders Points
      </h3>
      <p className="mt-2 text-xs md:text-sm text-slate-500">
        Be a part of our project. Support QMS and unlock voting access at 10,000
        SFP.
      </p>

      <div className="mt-4 md:mt-5 grid gap-2 md:gap-3 sm:grid-cols-2">
        <div className="relative" ref={wrapperRef}>
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="w-full rounded-xl bg-blue-600 px-4 py-2.5 md:py-3 text-sm font-semibold text-white shadow-none transition hover:bg-blue-700 animate-pulse"
          >
            {isSending ? 'Sending...' : 'Donate'}
          </button>
          {open ? (
            <div className="absolute left-0 z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
              <div className="grid gap-2">
                {presets.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleDonate(amount)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {amount.toFixed(amount < 1 ? 2 : 0)} SOL
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomMode((prev) => !prev)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Custom amount
                </button>
              </div>
              {customMode ? (
                <div className="mt-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    placeholder="Enter SOL amount"
                  />
                  <button
                    type="button"
                    onClick={() => handleDonate(Number(customAmount))}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    Donate custom amount
                  </button>
                </div>
              ) : null}
              {error ? (
                <p className="mt-2 text-[11px] font-semibold text-rose-600">
                  {error}
                </p>
              ) : null}
              {success ? (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[11px] text-emerald-700">
                  <img src="/logos/applogoQMS.png" alt="QMS" className="h-6 w-6" />
                  <div>
                    <div className="font-semibold">{success}</div>
                    <div>Mulțumesc! Nu o să vă dezamăgim!</div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
        <NavLink
          to="/dashboard/sfp/submit-referral"
          className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 md:py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Create a referral
        </NavLink>
        <NavLink
          to="/dashboard/sfp/submit-video"
          className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 md:py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Submit video
        </NavLink>
        <NavLink
          to="/dashboard/sfp/submit-social"
          className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 md:py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        >
          Submit post
        </NavLink>
      </div>

      <div className="mt-4 md:mt-6 border-t border-slate-200 pt-4 md:pt-5">
        <p className="text-[11px] md:text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
          Get SOL for DevNet/TestNet
        </p>
        <div className="mt-3 grid gap-2 md:gap-3">
          <input
            value={airdropAddress}
            onChange={(event) => setAirdropAddress(event.target.value)}
            placeholder="Wallet address"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <div className="flex gap-2">
            <select
              value={airdropNetwork}
              onChange={(event) => setAirdropNetwork(event.target.value)}
              className="h-11 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <option value="devnet">Devnet</option>
              <option value="testnet">Testnet</option>
            </select>
            <button
              type="button"
              onClick={handleAirdrop}
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              Get 1 SOL
            </button>
          </div>
          {airdropStatus ? (
            <p className="text-[11px] text-slate-500">{airdropStatus}</p>
          ) : null}
        </div>
      </div>

    </div>
  );
}
