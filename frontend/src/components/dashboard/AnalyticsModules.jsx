export function AnalyticsMetricGrid({ items = [] }) {
  return (
    <div className="analytics-metric-grid">
      {items.map((item) => (
        <article
          key={item.title}
          className={`analytics-metric-card ${item.tone ? `analytics-tone-${item.tone}` : ""}`.trim()}
        >
          <div className="card-kicker">{item.title}</div>
          <div className="analytics-value">{item.value}</div>
          {item.meta ? <div className="analytics-meta">{item.meta}</div> : null}
        </article>
      ))}
    </div>
  );
}

export function ActivityCalendarCard({
  days = [],
  title = "Activity Calendar",
  subtitle = "",
  className = "",
  totalActiveDays = 0,
  currentStreak = 0,
  longestStreak = 0,
}) {
  return (
    <section className={`section-panel ${className}`.trim()}>
      <div className="card-section-head">
        <div className="min-w-0">
          <h2 className="panel-title">{title}</h2>
          {subtitle ? <p className="mt-2 text-sm leading-7 muted-copy">{subtitle}</p> : null}
        </div>
      </div>
      <div className="mt-5 analytics-metric-grid">
        <article className="analytics-metric-card analytics-tone-cyan">
          <div className="analytics-label">Active Days</div>
          <div className="analytics-value">{totalActiveDays}</div>
          <div className="analytics-meta">Days with logged activity</div>
        </article>
        <article className="analytics-metric-card analytics-tone-violet">
          <div className="analytics-label">Current Streak</div>
          <div className="analytics-value">{currentStreak}</div>
          <div className="analytics-meta">Consecutive active days</div>
        </article>
        <article className="analytics-metric-card analytics-tone-emerald">
          <div className="analytics-label">Longest Streak</div>
          <div className="analytics-value">{longestStreak}</div>
          <div className="analytics-meta">Best consistency so far</div>
        </article>
      </div>
      <div className="activity-calendar-grid mt-5">
        {days.length ? (
          days.map((day) => (
            <div
              key={day.dayKey}
              className={`activity-day activity-level-${Math.min(day.count || 0, 3)}`.trim()}
              title={`${day.dayKey} / ${(day.types || []).join(", ") || "No activity"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="activity-day-number">
                  {/^\d{4}-\d{2}-\d{2}$/.test(day.dayKey) ? day.dayKey.slice(-2) : String(day.dayKey).slice(0, 2)}
                </div>
                <div className="activity-day-count">{day.count || 0}</div>
              </div>
              <div className="activity-day-meta">{(day.types || []).slice(0, 2).join(" / ")}</div>
            </div>
          ))
        ) : (
          <div className="empty-state col-span-full">Activity will appear here after login, quiz, and interview usage.</div>
        )}
      </div>
    </section>
  );
}

export function BadgeStrip({ badges = [], title = "Badges", className = "" }) {
  return (
    <section className={`section-panel ${className}`.trim()}>
      <div className="card-section-head">
        <div className="min-w-0">
          <h2 className="panel-title">{title}</h2>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        {badges.length ? (
          badges.map((badge) => (
            <span key={badge} className="achievement-badge">
              {badge}
            </span>
          ))
        ) : (
          <div className="empty-state w-full">No badges earned yet.</div>
        )}
      </div>
    </section>
  );
}

export function RecommendationComparisonList({
  items = [],
  title = "Company Recommendations",
  subtitle = "",
}) {
  return (
    <section className="section-panel">
      <div className="card-section-head">
        <div className="min-w-0">
          <h2 className="panel-title">{title}</h2>
          {subtitle ? <p className="mt-2 text-sm leading-7 muted-copy">{subtitle}</p> : null}
        </div>
      </div>
      <div className="mt-5 panel-scroll">
        {items.length ? (
          <div className="panel-stack">
            {items.map((item) => (
              <article key={item.name} className="comparison-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="card-kicker">Company Match</div>
                    <h3 className="card-title">{item.name}</h3>
                    <p className="card-copy mt-2">
                      Student {item.studentScore}% vs demand {item.demandScore}%
                    </p>
                  </div>
                  <span className="student-chip">{item.chanceLabel}</span>
                </div>
                <div className="comparison-metrics mt-4">
                  <div className="comparison-stat">
                    <div className="analytics-label">Gap</div>
                    <div className="text-2xl font-black text-slate-100">
                      {item.benchmarkGap >= 0 ? "+" : ""}
                      {item.benchmarkGap}%
                    </div>
                  </div>
                  <div className="comparison-stat">
                    <div className="analytics-label">Need to Improve</div>
                    <div className="text-lg font-bold text-slate-100">
                      {item.improvementNeeded ? `${item.improvementNeeded}% more` : "Ready now"}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">Company recommendation analytics will appear after enough performance data is available.</div>
        )}
      </div>
    </section>
  );
}
