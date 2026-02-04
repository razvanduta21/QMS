const MAX_SYMBOL_LENGTH = 10;

export default function CardWallet1TokenInfo({
  TextInput,
  SelectInput,
  network,
  networkOptions,
  handleNetworkChange,
  mintDraft,
  setMintDraft,
  walletAddress,
  feeBreakdown,
  nextStep,
  connected,
  isNetworkMismatch,
  errors,
  isNextDisabled
}) {
  const token = mintDraft.token;
  const updateToken = (updates) => {
    setMintDraft((prev) => ({
      ...prev,
      token: { ...prev.token, ...updates }
    }));
  };

  const handleSymbolChange = (event) => {
    const value = event.target.value.toUpperCase().slice(0, MAX_SYMBOL_LENGTH);
    updateToken({ symbol: value });
  };

  return (
    <div className="flex h-full">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <SelectInput
            label="Network"
            value={network.label}
            onChange={handleNetworkChange}
            options={networkOptions}
          />
          <TextInput
            label="Token Name"
            placeholder="COIN"
            value={token.name}
            onChange={(event) => updateToken({ name: event.target.value })}
            error={errors?.name}
          />
          <TextInput
            label="Decimals"
            type="number"
            placeholder="9"
            value={token.decimals}
            onChange={(event) => updateToken({ decimals: event.target.value })}
            hint="2"
            error={errors?.decimals}
          />
          <TextInput
            label="Symbol"
            placeholder="QMS"
            value={token.symbol || ""}
            onChange={handleSymbolChange}
            hint={`${token.symbol.length}/${MAX_SYMBOL_LENGTH}`}
            error={errors?.symbol}
          />
          <TextInput
            label="Supply"
            placeholder="1,000,000,000"
            value={token.supply}
            onChange={(event) => updateToken({ supply: event.target.value })}
            hint="COIN"
            error={errors?.supply}
          />
          <div className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            <span className="uppercase tracking-[0.25em]">Fee Info</span>
            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>Base network costs</span>
                <span className="font-semibold text-slate-900">
                  {feeBreakdown.base.toFixed(3)} SOL
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span>QMS fee</span>
                <span className="font-semibold text-slate-900">
                  {feeBreakdown.qms.toFixed(3)} SOL
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-slate-400">
                <span>+ metadata cost</span>
                <span className="font-semibold text-slate-500">
                  {feeBreakdown.metadata
                    ? `${feeBreakdown.metadata.toFixed(3)} SOL`
                    : "--"}
                </span>
              </div>
            </div>
            <span className="text-right text-xs text-slate-400">Estimated</span>
          </div>
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="uppercase tracking-[0.25em]">Mint to address</span>
              {connected && walletAddress ? (
                <button
                  type="button"
                  onClick={() => updateToken({ mintToAddress: walletAddress })}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Use my wallet
                </button>
              ) : null}
            </div>
            <input
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder={
                connected
                  ? "Wallet address"
                  : "Connect wallet to auto-fill"
              }
              value={token.mintToAddress}
              onChange={(event) => updateToken({ mintToAddress: event.target.value })}
            />
            <span className="text-[11px] text-slate-400">
              Defaults to connected wallet
            </span>
            {errors?.mintToAddress ? (
              <span className="text-[11px] text-rose-600">{errors.mintToAddress}</span>
            ) : null}
          </label>

          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-xs text-slate-600 md:col-span-2">
            <span className="uppercase tracking-[0.25em] text-slate-500">
              Supply type
            </span>
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              {[
                { value: "fixed", label: "Fixed supply (recommended)" },
                { value: "mintable", label: "Mintable (advanced)" }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => updateToken({ supplyType: option.value })}
                  className={`flex-1 rounded-lg px-3 py-2 text-[11px] font-semibold ${
                    token.supplyType === option.value
                      ? "bg-white text-blue-600"
                      : "text-slate-500"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {token.supplyType === "fixed" ? (
              <div className="text-[11px] text-slate-500">
                Mint authority will be revoked after mint.
              </div>
            ) : (
              <div className="text-[11px] text-amber-600">
                Keeping mint authority allows future minting. Use only if you
                understand the implications.
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-600">
            Estimated Fee:{" "}
            <span className="font-semibold text-slate-900">
              {feeBreakdown.total.toFixed(3)} SOL
            </span>
          </div>
          <button
            type="button"
            className="qms-btn-cta"
            onClick={nextStep}
            disabled={isNextDisabled}
          >
            Next
            <span>{'>'}</span>
          </button>
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-slate-600">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            !
          </span>
          <div>
            <p className="font-semibold text-slate-700">Never share your private keys.</p>
            <p className="text-slate-500">Verify all transaction details before confirming.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
