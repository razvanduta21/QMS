export default function PreviousMints({ items }) {
  return (
    <section className="qms-surface p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">Previous Mints</h3>
        <button className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
          View All
        </button>
      </div>
      <div className="mt-4 space-y-3">
        {items.map((mint) => (
          <div
            key={mint.name}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">{mint.name}</p>
              <p className="text-xs text-blue-600">{mint.address}</p>
            </div>
            <span className="text-xs text-slate-500">{mint.time}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
