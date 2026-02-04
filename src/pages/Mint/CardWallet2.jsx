export default function CardWallet2Authority({
  mintDraft,
  setMintDraft,
  prevStep,
  nextStep,
  isNetworkMismatch,
  errors,
  isNextDisabled
}) {
  const { authority, token, metadata } = mintDraft;
  const isSimple = authority.mode === "simple";
  const showUpdateAuthority = metadata.mode === "onchain";

  const updateAuthority = (updates) => {
    setMintDraft((prev) => ({
      ...prev,
      authority: { ...prev.authority, ...updates }
    }));
  };

  const toggleAuthority = (key) => {
    updateAuthority({ [key]: !authority[key] });
  };

  const authorityOptions = [
    { value: "wallet", label: "Wallet" },
    { value: "pda", label: "PDA" },
    { value: "multisig", label: "Multisig" }
  ];

  return (
    <div className="flex h-full">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="grid gap-5 md:grid-cols-2">
          <button
            type="button"
            onClick={() => updateAuthority({ mode: "simple" })}
            className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold ${
              isSimple
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 text-slate-700"
            }`}
          >
            Simple
            <p className="mt-2 text-xs font-normal text-slate-500">
              Keep standard mint & freeze authority with easy defaults.
            </p>
          </button>
          <button
            type="button"
            onClick={() => updateAuthority({ mode: "advanced" })}
            className={`rounded-2xl border px-4 py-4 text-left text-sm font-semibold ${
              !isSimple
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 text-slate-700"
            }`}
          >
            Advanced
            <p className="mt-2 text-xs font-normal text-slate-500">
              Customize mint, freeze, and update authorities.
            </p>
          </button>
        </div>

        {isSimple ? (
          <div className="flex flex-col gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              {[
                { key: "revokeMint", label: "Revoke Mint Authority" },
                { key: "revokeFreeze", label: "Revoke Freeze Authority" }
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleAuthority(item.key)}
                  className={`rounded-2xl border px-4 py-4 text-left text-xs font-semibold ${
                    authority[item.key]
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {item.label}
                  <div className="mt-2 text-[10px] font-normal text-slate-500">
                    {authority[item.key] ? "Enabled" : "Disabled"}
                  </div>
                </button>
              ))}
            </div>
            {token.supplyType === "fixed" ? (
              <p className="text-[11px] text-slate-500">
                Mint authority will be revoked after mint.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Authority type
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {authorityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      updateAuthority({
                        authorityType: option.value,
                        authorityAddress:
                          option.value === "wallet"
                            ? ""
                            : authority.authorityAddress
                      })
                    }
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                      authority.authorityType === option.value
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {authority.authorityType !== "wallet" ? (
                <div className="mt-3">
                  <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
                    <span className="uppercase tracking-[0.25em]">
                      Authority address
                    </span>
                    <input
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="Enter PDA / Multisig address"
                      value={authority.authorityAddress}
                      onChange={(event) =>
                        updateAuthority({ authorityAddress: event.target.value })
                      }
                    />
                    <span className="text-[11px] text-slate-400">
                      You must provide the address you control.
                    </span>
                    {errors?.authorityAddress ? (
                      <span className="text-[11px] text-rose-600">
                        {errors.authorityAddress}
                      </span>
                    ) : null}
                  </label>
                </div>
              ) : null}
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {[
                { key: "revokeMint", label: "Revoke Mint Authority" },
                { key: "revokeFreeze", label: "Revoke Freeze Authority" },
                ...(showUpdateAuthority
                  ? [{ key: "updateAuthority", label: "Update Authority" }]
                  : [])
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleAuthority(item.key)}
                  className={`rounded-2xl border px-4 py-4 text-left text-xs font-semibold ${
                    authority[item.key]
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600"
                  }`}
                >
                  {item.label}
                  <div className="mt-2 text-[10px] font-normal text-slate-500">
                    {authority[item.key] ? "Enabled" : "Disabled"}
                  </div>
                </button>
              ))}
            </div>

            {showUpdateAuthority && authority.updateAuthority ? (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-xs text-slate-600">
                <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
                  Update authority
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {authorityOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        updateAuthority({
                          updateAuthorityType: option.value,
                          updateAuthorityAddress:
                            option.value === "wallet"
                              ? ""
                              : authority.updateAuthorityAddress
                        })
                      }
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                        authority.updateAuthorityType === option.value
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 text-slate-600"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                {authority.updateAuthorityType !== "wallet" ? (
                  <div className="mt-3">
                    <input
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                      placeholder="Enter PDA / Multisig address"
                      value={authority.updateAuthorityAddress}
                      onChange={(event) =>
                        updateAuthority({
                          updateAuthorityAddress: event.target.value
                        })
                      }
                    />
                    <span className="mt-2 block text-[11px] text-slate-400">
                      You must provide the address you control.
                    </span>
                    {errors?.updateAuthorityAddress ? (
                      <span className="mt-1 block text-[11px] text-rose-600">
                        {errors.updateAuthorityAddress}
                      </span>
                    ) : null}
                  </div>
                ) : null}
                <p className="mt-3 text-[11px] text-slate-500">
                  Update authority applies to token metadata, not SPL mint
                  settings.
                </p>
              </div>
            ) : null}
          </div>
        )}

        {token.supplyType === "mintable" && !authority.revokeMint ? (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-700">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-white">
              !
            </span>
            <div>
              <p className="font-semibold text-amber-800">Warning</p>
              <p className="text-amber-700">
                Mint authority remains active. Token supply can be increased.
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={prevStep}
            className="rounded-xl border border-slate-200 px-6 py-2 text-sm font-semibold text-slate-600"
          >
            Back
          </button>
          <button
            type="button"
            className="qms-btn-cta"
            onClick={nextStep}
            disabled={isNextDisabled}
          >
            Next
            <span>{">"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
