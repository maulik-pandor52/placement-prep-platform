import { Link } from "react-router-dom";

export function DashboardSection({
  title,
  subtitle,
  action,
  kicker,
  scroll = false,
  children,
  className = "",
}) {
  return (
    <section className={`section-panel ${className}`.trim()}>
      <div className="card-section-head">
        <div className="min-w-0">
          {kicker ? <div className="section-kicker">{kicker}</div> : null}
          <h2 className="panel-title">{title}</h2>
          {subtitle ? <p className="mt-2 text-sm leading-7 muted-copy">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className={`mt-5 ${scroll ? "panel-scroll" : ""}`}>{children}</div>
    </section>
  );
}

export function SummaryPanel({ title, items = [], tone = "default", emptyText = "No items yet." }) {
  const toneMap = {
    success: "border-emerald-400/14 bg-emerald-400/8 text-slate-100",
    warning: "border-amber-400/14 bg-amber-400/8 text-slate-100",
    info: "border-cyan-300/14 bg-cyan-400/8 text-slate-100",
    default: "border-slate-600/30 bg-slate-900/50 text-slate-100",
  };

  return (
    <article className="summary-card">
      <div className="summary-card-title">{title}</div>
      <div className={`summary-card-body ${items.length <= 1 ? "summary-card-body-compact" : ""}`}>
        {items.length ? (
          <div className={`summary-card-scroll ${items.length <= 3 ? "overflow-visible max-h-none pr-0" : ""}`}>
            <div className="flex flex-col gap-2">
              {items.map((item) => (
                <div
                  key={`${title}-${item}`}
                  className={`summary-pill ${toneMap[tone] || toneMap.default}`}
                >
                  <span className="summary-pill-dot" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="summary-empty">{emptyText}</div>
        )}
      </div>
    </article>
  );
}

export function CompanySuggestionCard({
  company,
  actionLabel = "Take Company Test",
  layout = "grid",
}) {
  if (!company) {
    return null;
  }

  return (
    <article className={`company-card ${layout === "rows" ? "company-card-stacked" : ""}`.trim()}>
      <div className="company-card-header">
        <div className="min-w-0 flex-1">
          <div className="section-kicker">Suggested Company</div>
          <h3 className="company-card-title">{company.name}</h3>
        </div>
        <div className="company-card-badge">{company.selectionChance || 0}% chance</div>
      </div>

      <p className="company-card-copy">{company.matchReason}</p>

      <div className="company-stat-grid">
        <MiniInfoCard label="Demand Score" value={`${company.demandScore || 0}%`} />
        <MiniInfoCard
          label="Next Milestone"
          value={company.nextMilestone || "Keep improving"}
          compact
        />
      </div>

      <Link
        to={`/quiz?company=${encodeURIComponent(company.name)}`}
        className="primary-btn company-cta"
      >
        {actionLabel.replace("{company}", company.name)}
      </Link>
    </article>
  );
}

export function CompanySuggestionList({
  companies = [],
  emptyText,
  actionLabel,
  layout = "grid",
  scroll = false,
}) {
  if (!companies.length) {
    return <div className="empty-state">{emptyText}</div>;
  }

  return (
    <div className={`${scroll ? "company-scroll-shell" : ""}`.trim()}>
      <div className={`company-grid ${layout === "rows" ? "company-grid-rows" : ""}`.trim()}>
      {companies.map((company) => (
        <CompanySuggestionCard
          key={company.name}
          company={company}
          actionLabel={actionLabel || "Take {company} Test"}
          layout={layout}
        />
      ))}
      </div>
    </div>
  );
}

export function ScrollableList({ items = [], renderItem, emptyText, className = "" }) {
  if (!items.length) {
    return <div className="empty-state">{emptyText}</div>;
  }

  return (
    <div className={`panel-stack panel-scroll ${className}`.trim()}>
      {items.map(renderItem)}
    </div>
  );
}

function MiniInfoCard({ label, value, compact = false }) {
  return (
    <div className="metric-inline">
      <div className="card-kicker text-cyan-300">{label}</div>
      <div className={`mt-3 font-black text-slate-100 ${compact ? "text-lg leading-7" : "text-3xl"}`}>
        {value}
      </div>
    </div>
  );
}
