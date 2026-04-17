export function SkeletonMetricGrid({ count = 6 }) {
  return (
    <div className="dashboard-metric-grid">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="skeleton-card">
          <div className="skeleton-line skeleton-line-label" />
          <div className="skeleton-line skeleton-line-value" />
          <div className="skeleton-line skeleton-line-meta" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonPanel({ lines = 4, className = "" }) {
  return (
    <section className={`section-panel ${className}`.trim()}>
      <div className="skeleton-line skeleton-line-title" />
      <div className="mt-3 skeleton-line skeleton-line-meta" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: lines }).map((_, index) => (
          <div key={index} className="skeleton-card skeleton-card-compact">
            <div className="skeleton-line skeleton-line-label" />
            <div className="mt-3 skeleton-line skeleton-line-copy" />
          </div>
        ))}
      </div>
    </section>
  );
}

export function SkeletonSplitLayout() {
  return (
    <div className="dashboard-split mt-6">
      <div className="dashboard-stack">
        <SkeletonPanel lines={3} />
        <SkeletonPanel lines={2} />
      </div>
      <div className="dashboard-stack">
        <SkeletonPanel lines={3} />
        <SkeletonPanel lines={4} />
      </div>
    </div>
  );
}
