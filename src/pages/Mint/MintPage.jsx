import { useEffect, useMemo, useRef, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useMintFlow } from "../../hooks/useMintFlow.js";
import { useSolanaNetwork } from "../../providers/SolanaNetworkContext.jsx";
import { SOLANA_NETWORKS } from "../../config/solanaNetworks.js";
import { mintToken } from "../../services/solana/mintToken.js";
import { DEFAULT_MINT_DRAFT } from "../../context/MintContext.jsx";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import CardWallet1 from "./CardWallet1.jsx";
import CardWallet2 from "./CardWallet2.jsx";
import CardWallet3 from "./CardWallet3.jsx";
import CardWallet4 from "./CardWallet4.jsx";
import SFPPanel from "./SFPPanel.jsx";

const steps = [
  { id: 1, label: "Token Info" },
  { id: 2, label: "Authority Mode" },
  { id: 3, label: "Metadata" },
  { id: 4, label: "Review" },
];

const DRAFT_STORAGE_KEY = "qms_mint_draft";
const MAX_SYMBOL_LENGTH = 10;
const MAX_DESCRIPTION_LENGTH = 280;
const BASE58_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const FEE_CONFIG = {
  base: 0.01,
  qms: 0.004,
  metadata: 0.002
};

const isValidAddress = (value) => BASE58_ADDRESS.test(value || "");

const isValidHttpsUrl = (value) => {
  if (!value) return true;
  if (!value.startsWith("https://")) return false;
  try {
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const mergeDraft = (base, saved) => ({
  ...base,
  ...saved,
  token: { ...base.token, ...saved?.token },
  authority: { ...base.authority, ...saved?.authority },
  metadata: { ...base.metadata, ...saved?.metadata },
  confirmations: { ...base.confirmations, ...saved?.confirmations }
});

const validateStep = (step, mintDraft) => {
  const errors = {};
  const token = mintDraft.token;
  const authority = mintDraft.authority;
  const metadata = mintDraft.metadata;

  if (step === 1) {
    if (!token.name.trim()) errors.name = "Token name is required.";
    if (!token.symbol.trim()) errors.symbol = "Symbol is required.";
    if (token.symbol && token.symbol.length > MAX_SYMBOL_LENGTH) {
      errors.symbol = `Max ${MAX_SYMBOL_LENGTH} characters.`;
    }
    if (!token.mintToAddress.trim()) {
      errors.mintToAddress = "Mint address is required.";
    } else if (!isValidAddress(token.mintToAddress.trim())) {
      errors.mintToAddress = "Invalid Solana address.";
    }
    if (!token.supply || Number(token.supply) <= 0) {
      errors.supply = "Supply must be greater than 0.";
    }
    if (token.decimals === "" || Number.isNaN(Number(token.decimals))) {
      errors.decimals = "Decimals are required.";
    }
  }

  if (step === 2 && authority.mode === "advanced") {
    if (
      authority.authorityType !== "wallet" &&
      !isValidAddress(authority.authorityAddress.trim())
    ) {
      errors.authorityAddress = "Authority address is required.";
    }
    if (
      metadata.mode === "onchain" &&
      authority.updateAuthority &&
      authority.updateAuthorityType !== "wallet" &&
      !isValidAddress(authority.updateAuthorityAddress.trim())
    ) {
      errors.updateAuthorityAddress = "Update authority address is required.";
    }
  }

  if (step === 3) {
    if (metadata.description.length > MAX_DESCRIPTION_LENGTH) {
      errors.description = `Max ${MAX_DESCRIPTION_LENGTH} characters.`;
    }
    if (metadata.website && !isValidHttpsUrl(metadata.website)) {
      errors.website = "Website must start with https://";
    }
    if (metadata.twitter && !isValidHttpsUrl(metadata.twitter)) {
      errors.twitter = "Twitter URL must start with https://";
    }
    if (metadata.discord && !isValidHttpsUrl(metadata.discord)) {
      errors.discord = "Discord URL must start with https://";
    }
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
};

function TextInput({ label, hint, error, ...props }) {
  return (
    <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
      <span className="uppercase tracking-[0.25em]">{label}</span>
      <div className="relative">
        <input
          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          {...props}
        />
        {hint ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
            {hint}
          </span>
        ) : null}
      </div>
      {error ? <span className="text-[11px] text-rose-600">{error}</span> : null}
    </label>
  );
}

function SelectInput({ label, options = [], value, onChange }) {
  return (
    <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
      <span className="uppercase tracking-[0.25em]">{label}</span>
      <select
        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function Stepper({ currentStep, connected, isNetworkMismatch, onStepChange }) {
  const maxStep = !connected ? 1 : currentStep;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {steps.map((step, index) => {
        const isCurrent = step.id === currentStep;
        const isLocked = step.id > maxStep;
        return (
          <div
            key={step.id}
            role="button"
            tabIndex={0}
            onClick={() => {
              if (isLocked) return;
              onStepChange(step.id);
            }}
            className={`qms-step ${isCurrent ? "qms-step-active" : "qms-step-inactive"} ${
              index === steps.length - 1 ? "qms-step-last" : ""
            } ${isLocked ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            <span className="qms-step-index">{step.id}</span>
            {step.label}
          </div>
        );
      })}
    </div>
  );
}

export default function MintPage() {
  const wallet = useWallet();
  const { publicKey, connected, disconnect } = wallet;
  const { connection } = useConnection();
  const { mintDraft, setMintDraft, step: mintStep, setStep, reset } = useMintFlow();
  const { networkKey, setNetworkKey, network } = useSolanaNetwork();
  const [mintResult, setMintResult] = useState(null);
  const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState("");
  const [preflight, setPreflight] = useState({
    status: "idle",
    issues: []
  });
  const [walletBalance, setWalletBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const previousSupplyType = useRef(mintDraft.token.supplyType);
  const networkEntries = Object.entries(SOLANA_NETWORKS);
  const networkOptions = networkEntries.map(([, value]) => value.label);
  const networkShortLabel = network.label.replace(/^Solana\s+/i, "");
  const address = publicKey ? publicKey.toBase58() : null;
  const shortAddress = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : "Not connected";
  const isOnChainMetadata = mintDraft.metadata.mode === "onchain";
  const isNetworkMismatch = connected && networkKey !== "mainnet";
  const handleNetworkChange = (label) => {
    const match = networkEntries.find(([, value]) => value.label === label);
    if (match) {
      setNetworkKey(match[0]);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      const restored = mergeDraft(DEFAULT_MINT_DRAFT, parsed?.mintDraft || parsed);
      setMintDraft(restored);
      previousSupplyType.current = restored.token.supplyType;
      if (parsed?.step) {
        setStep(parsed.step);
      }
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  }, [setMintDraft, setStep]);

  useEffect(() => {
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ mintDraft, step: mintStep })
    );
  }, [mintDraft, mintStep]);

  useEffect(() => {
    if (!connected || !address) return;
    setMintDraft((prev) => {
      if (prev.token.mintToAddress) return prev;
      return {
        ...prev,
        token: { ...prev.token, mintToAddress: address }
      };
    });
  }, [connected, address, setMintDraft]);

  useEffect(() => {
    let active = true;
    if (!connected || !publicKey) {
      setWalletBalance(null);
      return;
    }
    const loadBalance = async () => {
      setBalanceLoading(true);
      try {
        const lamports = await connection.getBalance(publicKey, "confirmed");
        if (active) {
          setWalletBalance(lamports / LAMPORTS_PER_SOL);
        }
      } catch {
        if (active) {
          setWalletBalance(null);
        }
      } finally {
        if (active) {
          setBalanceLoading(false);
        }
      }
    };
    loadBalance();
    return () => {
      active = false;
    };
  }, [connected, publicKey, connection, networkKey]);

  useEffect(() => {
    const previous = previousSupplyType.current;
    if (previous === mintDraft.token.supplyType) return;
    setMintDraft((prev) => {
      const updated = {
        ...prev,
        authority: { ...prev.authority }
      };
      if (prev.token.supplyType === "fixed") {
        updated.authority.revokeMint = true;
      }
      if (prev.token.supplyType === "mintable" && prev.authority.mode === "simple") {
        updated.authority.revokeMint = false;
      }
      return updated;
    });
    previousSupplyType.current = mintDraft.token.supplyType;
  }, [mintDraft.token.supplyType, setMintDraft]);

  useEffect(() => {
    if (mintDraft.authority.mode !== "simple") return;
    setMintDraft((prev) => {
      const desired = prev.token.supplyType === "fixed";
      if (prev.authority.revokeMint === desired) return prev;
      return {
        ...prev,
        authority: {
          ...prev.authority,
          revokeMint: desired
        }
      };
    });
  }, [mintDraft.authority.mode, setMintDraft]);

  useEffect(() => {
    if (mintDraft.authority.mode !== "simple") return;
    if (!mintDraft.authority.updateAuthority) return;
    setMintDraft((prev) => ({
      ...prev,
      authority: {
        ...prev.authority,
        updateAuthority: false,
        updateAuthorityType: "wallet",
        updateAuthorityAddress: ""
      }
    }));
  }, [mintDraft.authority.mode, mintDraft.authority.updateAuthority, setMintDraft]);

  useEffect(() => {
    if (mintDraft.metadata.mode !== "offchain") return;
    if (!mintDraft.authority.updateAuthority) return;
    setMintDraft((prev) => ({
      ...prev,
      authority: {
        ...prev.authority,
        updateAuthority: false,
        updateAuthorityType: "wallet",
        updateAuthorityAddress: ""
      }
    }));
  }, [mintDraft.metadata.mode, mintDraft.authority.updateAuthority, setMintDraft]);

  useEffect(() => {
    if (!connected && mintStep !== 1) {
      setStep(1);
    }
  }, [connected, mintStep, setStep]);

  const feeBreakdown = useMemo(() => {
    const metadataCost = isOnChainMetadata ? FEE_CONFIG.metadata : 0;
    return {
      base: FEE_CONFIG.base,
      qms: FEE_CONFIG.qms,
      metadata: metadataCost,
      total: FEE_CONFIG.base + FEE_CONFIG.qms + metadataCost
    };
  }, [isOnChainMetadata]);

  const stepValidation = useMemo(
    () => validateStep(mintStep, mintDraft),
    [mintStep, mintDraft]
  );

  const nextStep = () => {
    if (mintStep < steps.length) {
      setStep(mintStep + 1);
    }
  };

  const prevStep = () => {
    if (mintStep > 1) {
      setStep(mintStep - 1);
    }
  };

  const summaryItems = useMemo(() => {
    const authorityLabel =
      mintDraft.authority.mode === "simple"
        ? "Simple"
        : `Advanced • ${mintDraft.authority.authorityType}`;
    const authorityAddress =
      mintDraft.authority.mode === "advanced" &&
      mintDraft.authority.authorityType !== "wallet"
        ? mintDraft.authority.authorityAddress
        : address
          ? `${address.slice(0, 4)}...${address.slice(-4)}`
          : "Connected wallet";
    return [
      { label: "Token Name", value: mintDraft.token.name || "N/A" },
      { label: "Symbol", value: mintDraft.token.symbol || "N/A" },
      { label: "Decimals", value: mintDraft.token.decimals ?? "N/A" },
      { label: "Supply", value: mintDraft.token.supply || "N/A" },
      {
        label: "Mint-to Address",
        value: mintDraft.token.mintToAddress || "N/A"
      },
      {
        label: "Supply Type",
        value: mintDraft.token.supplyType === "fixed" ? "Fixed" : "Mintable"
      },
      {
        label: "Authority Mode",
        value: authorityLabel
      },
      {
        label: "Authority Address",
        value: authorityAddress || "N/A"
      },
      {
        label: "Metadata Mode",
        value: mintDraft.metadata.mode === "onchain" ? "On-chain" : "Off-chain"
      }
    ];
  }, [mintDraft, address]);

  const requiresRevokeAck =
    mintDraft.token.supplyType === "fixed" || mintDraft.authority.revokeMint;

  const hardErrors =
    !connected ||
    !isValidAddress(mintDraft.token.mintToAddress) ||
    (mintDraft.authority.mode === "advanced" &&
      mintDraft.authority.authorityType !== "wallet" &&
      !isValidAddress(mintDraft.authority.authorityAddress)) ||
    (mintDraft.metadata.mode === "onchain" &&
      mintDraft.authority.updateAuthority &&
      mintDraft.authority.updateAuthorityType !== "wallet" &&
      !isValidAddress(mintDraft.authority.updateAuthorityAddress));

  const handleClearDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    reset();
    setMintResult(null);
    setMintError("");
  };

  const handleMint = async () => {
    if (isMinting) return;
    setMintError("");
    setIsMinting(true);
    try {
      const result = await mintToken(mintDraft, { connection, wallet });
      setMintResult(result);
    } catch (error) {
      console.error("Mint failed", error);
      setMintError(error?.message || "Mint failed. Check console for details.");
    } finally {
      setIsMinting(false);
    }
  };

  useEffect(() => {
    let active = true;
    const runChecks = async () => {
      const issues = [];
      if (!connected) {
        issues.push("Wallet not connected");
      }
      if (!isValidAddress(mintDraft.token.mintToAddress)) {
        issues.push("Mint-to address is invalid");
      }
      if (
        mintDraft.authority.mode === "advanced" &&
        mintDraft.authority.authorityType !== "wallet" &&
        !isValidAddress(mintDraft.authority.authorityAddress)
      ) {
        issues.push("Authority address is invalid");
      }
      if (
        mintDraft.metadata.mode === "onchain" &&
        mintDraft.authority.updateAuthority &&
        mintDraft.authority.updateAuthorityType !== "wallet" &&
        !isValidAddress(mintDraft.authority.updateAuthorityAddress)
      ) {
        issues.push("Update authority address is invalid");
      }

      if (connected && publicKey) {
        try {
          const lamports = await connection.getBalance(publicKey, "confirmed");
          const balanceSol = lamports / LAMPORTS_PER_SOL;
          if (balanceSol < feeBreakdown.total) {
            issues.push("Balance may be too low for estimated fees");
          }
        } catch {
          issues.push("Unable to check wallet balance");
        }
      }

      const status = issues.length ? "warning" : "success";
      if (active) {
        setPreflight({ status, issues });
      }
    };

    runChecks();
    return () => {
      active = false;
    };
  }, [
    connected,
    publicKey,
    connection,
    mintDraft,
    feeBreakdown.total
  ]);

  return (
    <div className="mx-auto max-w-[1360px] py-10">
      {/* Stepper + Page Title */}
      <section className="qms-surface px-10 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
            Create a Coin
          </p>
        </div>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          Create a Coin
        </h2>
        <div className="mt-3">
          <Stepper
            currentStep={mintStep}
            connected={connected}
            isNetworkMismatch={isNetworkMismatch}
            onStepChange={setStep}
          />
        </div>
      </section>

      <div className="mt-6 grid gap-8">
        <div className="space-y-8">
          {/* Card Wallet + SFP row */}
          <div className="grid gap-8 lg:grid-cols-12">
            <section className="min-h-[500px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col lg:col-span-8">
            {connected ? (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-700">
                  Wallet balance{" "}
                  {balanceLoading
                    ? "..."
                    : walletBalance !== null
                      ? `${walletBalance.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 4
                        })} SOL`
                      : "--"}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span>Wallet connected • {networkShortLabel}</span>
                  <span className="font-semibold text-slate-900">
                    {shortAddress}
                  </span>
                  <button
                    type="button"
                    onClick={disconnect}
                    className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            ) : null}

            <div className="flex-1">
              {/* CardWallet1 - Step 1: Token Info */}
              {mintStep === 1 ? (
              <CardWallet1
                TextInput={TextInput}
                SelectInput={SelectInput}
                network={network}
                networkOptions={networkOptions}
                handleNetworkChange={handleNetworkChange}
                mintDraft={mintDraft}
                setMintDraft={setMintDraft}
                walletAddress={address}
                feeBreakdown={feeBreakdown}
                nextStep={nextStep}
                connected={connected}
                isNetworkMismatch={isNetworkMismatch}
                errors={stepValidation.errors}
                isNextDisabled={!stepValidation.isValid || !connected}
              />
            ) : null}

            {/* CardWallet2 - Step 2: Authority Mode */}
            {mintStep === 2 ? (
              <CardWallet2
                mintDraft={mintDraft}
                setMintDraft={setMintDraft}
                prevStep={prevStep}
                nextStep={nextStep}
                isNetworkMismatch={isNetworkMismatch}
                errors={stepValidation.errors}
                isNextDisabled={!stepValidation.isValid}
              />
            ) : null}

            {/* CardWallet3 - Step 3: Metadata */}
            {mintStep === 3 ? (
              <CardWallet3
                TextInput={TextInput}
                mintDraft={mintDraft}
                setMintDraft={setMintDraft}
                prevStep={prevStep}
                nextStep={nextStep}
                isNetworkMismatch={isNetworkMismatch}
                errors={stepValidation.errors}
                isNextDisabled={!stepValidation.isValid}
              />
            ) : null}

              {/* CardWallet4 - Step 4: Review */}
              {mintStep === 4 ? (
              <CardWallet4
                summaryItems={summaryItems}
                mintDraft={mintDraft}
                prevStep={prevStep}
                isNetworkMismatch={isNetworkMismatch}
                preflight={preflight}
                isMinting={isMinting}
                mintError={mintError}
                onMint={handleMint}
                mintResult={mintResult}
                onClearDraft={handleClearDraft}
                requiresRevokeAck={requiresRevokeAck}
                setMintDraft={setMintDraft}
                isMintDisabled={
                  hardErrors ||
                  (requiresRevokeAck && !mintDraft.confirmations.revokeMintAcknowledged)
                }
                network={network}
                networkKey={networkKey}
              />
            ) : null}
            </div>
            </section>

            {/* System Funders Points */}
            <div className="lg:col-span-4 lg:sticky lg:top-20 h-fit">
              <SFPPanel />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
