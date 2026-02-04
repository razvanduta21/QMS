export default function SubmitVideo() {
  return (
    <div className="mx-auto max-w-[1360px] py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Video Promotion</h2>
        <p className="mt-2 text-sm text-slate-500">
          Videoclipul trebuie sa ramana public minimum 7 zile. Se calculeaza
          SFP pentru vizualizarile din primele 7 zile.
        </p>
      </section>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            <span className="uppercase tracking-[0.25em]">Platform</span>
            <select className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100">
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-xs font-semibold text-slate-500">
            <span className="uppercase tracking-[0.25em]">Video URL</span>
            <input
              className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              placeholder="https://..."
            />
          </label>
        </div>

        <button
          type="button"
          className="mt-6 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          Submit for Review
        </button>
      </div>
    </div>
  );
}
