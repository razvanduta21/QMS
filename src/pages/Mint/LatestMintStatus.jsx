export default function LatestMintStatus({ items }) {
  return (
    <section className="qms-surface p-6">
      <h3 className="text-base font-semibold text-slate-800">Latest Mint Status</h3>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3"
          >
            <div>
              <p className="text-sm font-semibold text-slate-800">{item.name}</p>
              <p className="text-xs text-slate-500">{item.time}</p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
