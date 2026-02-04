function TemplateCard({ template }) {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 p-5 text-white shadow-lg">
      <h4 className="text-base font-semibold">{template.title}</h4>
      <p className="mt-2 text-xs text-blue-100">{template.description}</p>
      <button className="mt-4 w-full rounded-xl bg-white px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50">
        Use Template
      </button>
    </div>
  );
}

export default function CoinTemplates({ templates }) {
  return (
    <section className="qms-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-800">Coin Templates</h3>
        <button className="qms-btn-primary px-3 py-1 text-xs">+ Mint Another Coin</button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {templates.map((template) => (
          <TemplateCard key={template.title} template={template} />
        ))}
      </div>
    </section>
  );
}
