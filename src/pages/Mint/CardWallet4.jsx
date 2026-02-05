export default function CardWallet4Review({
  summaryItems,
  mintDraft,
  prevStep,
  preflight,
  onMint,
  isMintDisabled,
  isMinting,
  mintError,
  mintResult,
  onClearDraft,
  requiresRevokeAck,
  setMintDraft,
  network,
  networkKey
}) {
  const handleCopy = () => {
    if (!mintResult?.mint) return;
    navigator.clipboard?.writeText(mintResult.mint);
  };
  const handleCopyMetadata = () => {
    if (!mintResult?.metadataUri) return;
    navigator.clipboard?.writeText(mintResult.metadataUri);
  };

  const explorerUrl = mintResult?.mint
    ? `https://explorer.solana.com/address/${mintResult.mint}${
        networkKey === "mainnet" ? "" : `?cluster=${network.value}`
      }`
    : "";
  const metadataUrl = mintResult?.metadataUri || "";

  if (mintResult?.mint) {
    return (
      <div className="flex h-full">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 md:gap-5">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-3 md:px-4 md:py-4 text-xs md:text-sm text-emerald-700">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
              Success
            </p>
            <h3 className="mt-2 text-base md:text-lg font-semibold text-emerald-800">
              Token minted successfully
            </h3>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 md:px-4 md:py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Mint Address
            </p>
            <p className="mt-2 break-all text-xs md:text-sm font-semibold text-slate-800">
              {mintResult.mint}
            </p>
            <div className="mt-3 md:mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Copy
              </button>
              <a
                href={explorerUrl}
                className="qms-btn-primary px-4 py-2 text-xs"
                target="_blank"
                rel="noreferrer"
              >
                View on Explorer
              </a>
            </div>
          </div>

          {metadataUrl ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 md:px-4 md:py-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                Metadata URI
              </p>
              <p className="mt-2 break-all text-xs md:text-sm font-semibold text-slate-800">
                {metadataUrl}
              </p>
              <div className="mt-3 md:mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopyMetadata}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Copy
                </button>
                <a
                  href={metadataUrl}
                  className="qms-btn-primary px-4 py-2 text-xs"
                  target="_blank"
                  rel="noreferrer"
                >
                  Open Metadata
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 md:gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs md:text-sm font-semibold text-slate-700">Summary</h3>
          <button
            type="button"
            onClick={onClearDraft}
            className="text-[11px] md:text-xs font-semibold text-slate-400 hover:text-slate-600"
          >
            Clear draft
          </button>
        </div>

        <div className="grid gap-3 md:gap-5 md:grid-cols-2">
          {summaryItems.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 md:px-4 md:py-3"
            >
              <p className="text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-1 text-[13px] md:text-sm font-semibold text-slate-800">
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 md:px-4 md:py-3 text-[11px] md:text-xs text-slate-600">
          <p className="font-semibold text-slate-700">What happens next</p>
          <p className="mt-1">
            Next: create mint → create ATA → mint supply → revoke (optional) →
            transfer fee
          </p>
        </div>

        <div
          className={`rounded-2xl border px-3 py-2 md:px-4 md:py-3 text-[11px] md:text-xs ${
            preflight.status === "success"
              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
              : "border-amber-100 bg-amber-50 text-amber-700"
          }`}
        >
          <p className="font-semibold">
            Preflight:{" "}
            {preflight.status === "success" ? "Likely success" : "Potential issue"}
          </p>
          {preflight.issues?.length ? (
            <ul className="mt-2 list-disc pl-4 text-[10px] md:text-[11px]">
              {preflight.issues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : null}
        </div>

        {mintError ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 px-3 py-2 md:px-4 md:py-3 text-[11px] md:text-xs text-red-700">
            <p className="font-semibold">Mint failed</p>
            <p className="mt-1">{mintError}</p>
          </div>
        ) : null}

        {requiresRevokeAck ? (
          <label className="flex items-center gap-3 text-[11px] md:text-xs text-slate-600">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-blue-600"
              checked={mintDraft.confirmations.revokeMintAcknowledged}
              onChange={(event) =>
                setMintDraft((prev) => ({
                  ...prev,
                  confirmations: {
                    ...prev.confirmations,
                    revokeMintAcknowledged: event.target.checked
                  }
                }))
              }
            />
            I understand that revoking mint authority is irreversible.
          </label>
        ) : null}

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={prevStep}
            className="w-full rounded-xl border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600 md:w-auto"
          >
            Back
          </button>
          <button
            type="button"
            className="qms-btn-primary w-full px-6 py-2 text-sm md:w-auto"
            onClick={onMint}
            disabled={isMintDisabled || isMinting}
          >
            {isMinting ? "Minting..." : "Mint Coin"}
          </button>
        </div>
      </div>
    </div>
  );
}
