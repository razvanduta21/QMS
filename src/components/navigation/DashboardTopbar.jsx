import { NavLink } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import ConnectWalletButton from './ConnectWalletButton.jsx';
import SelectNetworkButton from './SelectNetworkButton.jsx';

const NAV_ITEMS = [
  { label: 'Create Coin', to: '/create' },
  { label: 'Funders Points', to: '/dashboard' }
];

export default function DashboardTopbar() {
  const { connected } = useWallet();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!wrapperRef.current || wrapperRef.current.contains(event.target)) return;
      setOpen(false);
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 rounded-[20px] h-[56px]">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <NavLink to="/" className="flex items-center gap-3">
            <img src="/logos/applogoQMS.png" alt="QMS" className="h-9 md:h-10" />
          </NavLink>
          <div className="relative" ref={wrapperRef}>
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="qms-pill"
            >
              Menu
              <span className="text-slate-400">▾</span>
            </button>
            {open ? (
              <div className="absolute left-0 mt-2 w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center rounded-xl px-3 py-2 text-xs font-semibold transition ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`
                    }
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ConnectWalletButton />
          {connected ? <SelectNetworkButton /> : null}
        </div>
      </div>
    </header>
  );
}
