import { Link } from "react-router-dom";

export function MetricGrid({ children, className = "" }) {
  return <div className={`dashboard-metric-grid ${className}`.trim()}>{children}</div>;
}

export function MetricStatCard({ title, value, meta, tone = "default" }) {
  const toneMap = {
    default: "border-slate-600/30 bg-slate-900/75",
    cyan: "border-cyan-300/20 bg-cyan-400/10",
    violet: "border-violet-400/20 bg-violet-400/10",
    emerald: "border-emerald-400/20 bg-emerald-400/10",
  };

  return (
    <article className={`balanced-card ${toneMap[tone] || toneMap.default}`}>
      <div className="card-header-block">
        <div className="card-kicker">{title}</div>
      </div>
      <div className="card-value">{value}</div>
      {meta ? <div className="card-meta">{meta}</div> : null}
    </article>
  );
}

export function ScrollListPanel({
  title,
  subtitle,
  items = [],
  emptyText,
  renderItem,
  action,
  className = "",
}) {
  return (
    <section className={`section-panel ${className}`.trim()}>
      <div className="card-section-head">
        <div className="min-w-0">
          <h2 className="panel-title">{title}</h2>
          {subtitle ? <p className="mt-2 text-sm leading-7 muted-copy">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="mt-5 scroll-shell">
        {items.length ? (
          <div className="compact-stack">{items.map(renderItem)}</div>
        ) : (
          <div className="empty-state">{emptyText}</div>
        )}
      </div>
    </section>
  );
}

export function ActionLinkCard({ title, text, to, cta, className = "" }) {
  return (
    <article className={`balanced-card ${className}`.trim()}>
      <div className="card-header-block">
        <div className="card-kicker">Quick Action</div>
        <h3 className="card-title">{title}</h3>
        <p className="card-copy">{text}</p>
      </div>
      <Link to={to} className="secondary-btn mt-6 self-start">
        {cta}
      </Link>
    </article>
  );
}
