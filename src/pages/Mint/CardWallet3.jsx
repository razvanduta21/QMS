import { useState } from "react";

const MAX_DESCRIPTION_LENGTH = 280;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"];

export default function CardWallet3Metadata({
  TextInput,
  mintDraft,
  setMintDraft,
  prevStep,
  nextStep,
  isNetworkMismatch,
  errors,
  isNextDisabled
}) {
  const { metadata } = mintDraft;
  const [logoWarning, setLogoWarning] = useState("");
  const [logoError, setLogoError] = useState("");

  const updateMetadata = (updates) => {
    setMintDraft((prev) => ({
      ...prev,
      metadata: { ...prev.metadata, ...updates }
    }));
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLogoError("Accepted formats: PNG, JPG, WebP.");
      return;
    }
    setLogoError("");
    if (file.size > 1024 * 1024) {
      setLogoWarning("Large file size. Recommended 512×512.");
    } else {
      setLogoWarning("");
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateMetadata({
        logoDataUrl: reader.result,
        logoFileName: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-full">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-xs text-slate-600">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
            Metadata mode
          </p>
          <div className="mt-3 flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            {[
              { value: "offchain", label: "Off-chain only (recommended)" },
              { value: "onchain", label: "On-chain metadata (cost extra)" }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateMetadata({ mode: option.value })}
                className={`flex-1 rounded-lg px-3 py-2 text-[11px] font-semibold ${
                  metadata.mode === option.value
                    ? "bg-white text-blue-600"
                    : "text-slate-500"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {metadata.mode === "onchain" ? (
            <p className="mt-2 text-[11px] text-amber-600">
              Uploads metadata JSON + logo and writes URI on-chain.
            </p>
          ) : null}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            <span className="uppercase tracking-[0.25em]">Logo Upload</span>
            <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-xs text-slate-400">
              {metadata.logoDataUrl ? (
                <div className="flex w-full flex-col items-center gap-3 py-3">
                  <div className="h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <img
                      src={metadata.logoDataUrl}
                      alt="Token logo preview"
                      className={`h-full w-full ${
                        metadata.cropToSquare ? "object-cover" : "object-contain"
                      }`}
                    />
                  </div>
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-blue-600"
                    onClick={() => updateMetadata({ cropToSquare: !metadata.cropToSquare })}
                  >
                    {metadata.cropToSquare ? "Crop to square ✓" : "Crop to square"}
                  </button>
                </div>
              ) : (
                <span>Drag & drop or click to upload</span>
              )}
            </div>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.webp"
              onChange={handleLogoChange}
              className="text-xs"
            />
            <span className="text-[11px] text-slate-400">Recommended 512×512</span>
            {logoWarning ? (
              <span className="text-[11px] text-amber-600">{logoWarning}</span>
            ) : null}
            {logoError ? (
              <span className="text-[11px] text-red-500">{logoError}</span>
            ) : null}
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            <span className="uppercase tracking-[0.25em]">Description</span>
            <textarea
              className="h-24 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Describe your token"
              maxLength={MAX_DESCRIPTION_LENGTH}
              value={metadata.description}
              onChange={(event) =>
                updateMetadata({
                  description: event.target.value
                })
              }
            />
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Max {MAX_DESCRIPTION_LENGTH} characters</span>
              <span>
                {metadata.description.length}/{MAX_DESCRIPTION_LENGTH}
              </span>
            </div>
            {errors?.description ? (
              <span className="text-[11px] text-rose-600">{errors.description}</span>
            ) : null}
          </label>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          <TextInput
            label="Website"
            placeholder="https://"
            value={metadata.website}
            onChange={(event) =>
              updateMetadata({
                website: event.target.value
              })
            }
            error={errors?.website}
          />
          <TextInput
            label="Twitter"
            placeholder="https://"
            value={metadata.twitter}
            onChange={(event) =>
              updateMetadata({
                twitter: event.target.value
              })
            }
            error={errors?.twitter}
          />
          <TextInput
            label="Discord"
            placeholder="https://"
            value={metadata.discord}
            onChange={(event) =>
              updateMetadata({
                discord: event.target.value
              })
            }
            error={errors?.discord}
          />
        </div>

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

        <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-slate-600">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white">
            !
          </span>
          <div>
            <p className="font-semibold text-slate-700">Tip</p>
            <p className="text-slate-500">
              Off-chain metadata keeps fees low. On-chain metadata increases cost.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
