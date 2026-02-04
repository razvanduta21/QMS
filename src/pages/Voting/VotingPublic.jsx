export default function VotingPublic() {
  return (
    <div className="px-6 py-8 lg:px-10 lg:py-10">
      <section className="qms-surface px-10 py-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
          Voting
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">
          QMS Governance
        </h2>
        <p className="mt-3 text-sm text-slate-500">
          Anyone can view proposals. Voting is unlocked at 10,000 SFP.
        </p>
      </section>

      <div className="mt-8 qms-surface px-8 py-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Proposal: Adjust QMS Fee
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Increase QMS fee to support infrastructure costs.
            </p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Active
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-400"
            disabled
          >
            Vote Yes
          </button>
          <button
            type="button"
            className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-400"
            disabled
          >
            Vote No
          </button>
          <span className="text-xs text-slate-500">
            Voting requires 10,000 SFP.
          </span>
        </div>
      </div>
    </div>
  );
}
