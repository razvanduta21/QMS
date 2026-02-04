export default function SubmitReferral() {
  return (
    <div className="mx-auto max-w-[1360px] py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">
          Referral Submission
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          A referral is valid after the invited user creates an account and donates
          at least 0.01 SOL.
        </p>
      </section>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            <span className="uppercase tracking-[0.25em]">Referral Wallet</span>
            <input
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="Enter wallet address"
            />
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            <span className="uppercase tracking-[0.25em]">Email (optional)</span>
            <input
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="name@email.com"
            />
          </label>
        </div>

        <button
          type="button"
          className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          Submit Referral
        </button>
      </div>
    </div>
  );
}
