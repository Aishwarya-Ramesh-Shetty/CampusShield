export default function PageShell({ title, eyebrow, children, actions }) {
  return (
    <section aria-labelledby="page-title" className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-teal-800">{eyebrow}</p>
          <h1 id="page-title" className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
        </div>
        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
