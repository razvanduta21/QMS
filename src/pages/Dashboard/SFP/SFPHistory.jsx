const sampleHistory = [
  { label: 'Donation', value: '+1,000 SFP', status: 'Approved' },
  { label: 'Referral', value: '+200 SFP', status: 'Pending' },
  { label: 'Social Post', value: '+50 SFP', status: 'Approved' },
  { label: 'Video', value: '+12 SFP', status: 'Rejected' }
];

export default function SFPHistory() {
  return (
    <div className="mx-auto max-w-[1360px] py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">SFP History</h2>
        <p className="mt-2 text-sm text-slate-500">
          Track donations, referrals, and promotional submissions.
        </p>
      </section>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-400">
          <span>Source</span>
          <span>Points</span>
          <span>Status</span>
        </div>
        <div className="mt-4 space-y-3">
          {sampleHistory.map((item) => (
            <div
              key={`${item.label}-${item.status}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700"
            >
              <span className="font-semibold text-slate-800">{item.label}</span>
              <span className="text-slate-600">{item.value}</span>
              <span className="text-xs font-semibold text-slate-700">{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
