import { Link, useNavigate } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import useStudentPerformance from "../components/useStudentPerformance";

export default function StudentInsightsPage() {
  const navigate = useNavigate();
  const { skillTracker, latestReport, loading } = useStudentPerformance({ navigate });
  const peer = skillTracker.peerComparison || {};

  return (
    <StudentLayout
      title="Performance insights"
      subtitle="Track trends, understand weak areas, and compare your readiness against peers in one dedicated analytics space."
      actions={
        <>
          <Link to="/quiz" className="primary-btn">
            Practice Again
          </Link>
          <Link to="/opportunities" className="secondary-btn">
            Company Opportunities
          </Link>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="section-panel">
          <h2 className="panel-title">Skill tracker</h2>
          <div className="mt-5 space-y-4">
            {skillTracker.trackedSkills?.slice(0, 6).map((skill) => (
              <ProgressCard
                key={skill.label}
                label={skill.label}
                value={skill.latest}
                meta={skill.trendLabel || "Current tracked score"}
              />
            ))}
            {!skillTracker.trackedSkills?.length ? (
              <div className="empty-state">Complete more quizzes to unlock tracked skills.</div>
            ) : null}
          </div>
        </section>

        <section className="section-panel">
          <h2 className="panel-title">Weak area priority</h2>
          <div className="mt-5 space-y-3">
            {(latestReport.weakAreaDetails?.length
              ? latestReport.weakAreaDetails.slice(0, 5)
              : []).map((item) => (
              <div key={`${item.type}-${item.label}`} className="student-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-100">{item.label}</div>
                  <span className="student-chip text-xs uppercase tracking-[0.18em]">
                    {item.percentage}%
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.reason}</p>
                <div className="mt-3 rounded-[18px] border border-slate-700/50 px-4 py-3 text-sm leading-7 text-slate-300">
                  {item.nextStep}
                </div>
              </div>
            ))}
            {!latestReport.weakAreaDetails?.length ? (
              <div className="empty-state">Weak area analysis will appear after a scored quiz.</div>
            ) : null}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="section-panel">
          <h2 className="panel-title">Peer comparison</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <MiniCard title="Your Score" value={`${peer.yourScore || 0}%`} />
            <MiniCard title="Peer Average" value={`${peer.averageScore || 0}%`} />
            <MiniCard title="Percentile" value={`${peer.percentile || 0}th`} />
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ListCard
              title="Ahead of peers in"
              items={peer.strengthsVsPeers}
              emptyText="No standout lead yet."
            />
            <ListCard
              title="Needs more work"
              items={peer.needsVsPeers}
              emptyText="No major peer gap right now."
            />
          </div>
        </section>

        <section className="section-panel">
          <h2 className="panel-title">Readiness and roadmap</h2>
          <div className="mt-5 student-tint">
            <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">
              Readiness summary
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-200">
              {latestReport.readinessSummary || "Complete a quiz to generate your readiness summary."}
            </p>
          </div>
          <div className="mt-5 space-y-3">
            {(latestReport.improvementRoadmap?.length
              ? latestReport.improvementRoadmap
              : ["Your roadmap will appear after your next completed quiz."]).map((item) => (
              <div key={item} className="student-card text-sm leading-7 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="section-panel">
          <h2 className="panel-title">Skill gap analysis</h2>
          <div className="mt-5 space-y-4">
            {(latestReport.skillGapAnalysis?.length ? latestReport.skillGapAnalysis : []).map((item) => (
              <ProgressCard
                key={item.label}
                label={item.label}
                value={item.currentScore}
                meta={`Target ${item.targetScore}% / Gap ${item.gap}% / Priority ${item.priority}`}
              />
            ))}
            {!latestReport.skillGapAnalysis?.length ? (
              <div className="empty-state">No skill-gap analysis yet.</div>
            ) : null}
          </div>
        </section>

        <section className="section-panel">
          <h2 className="panel-title">Category insights</h2>
          <div className="mt-5 space-y-3">
            {(latestReport.categoryInsights?.length
              ? latestReport.categoryInsights
              : ["Category-level insight will appear after your next graded quiz."]).map((item) => (
              <div key={item} className="student-card text-sm leading-7 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      {loading ? <div className="mt-6 empty-state">Refreshing insight data...</div> : null}
    </StudentLayout>
  );
}

function ProgressCard({ label, value = 0, meta }) {
  return (
    <div className="student-card">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="font-semibold text-slate-100">{label}</span>
        <span className="text-sm text-slate-400">{value}%</span>
      </div>
      <div className="student-progress">
        <span style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <div className="mt-3 text-sm text-slate-400">{meta}</div>
    </div>
  );
}

function MiniCard({ title, value }) {
  return (
    <div className="student-tint">
      <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">{title}</div>
      <div className="mt-3 text-3xl font-black text-slate-100">{value}</div>
    </div>
  );
}

function ListCard({ title, items = [], emptyText }) {
  return (
    <div className="student-card">
      <div className="text-sm uppercase tracking-[0.2em] text-slate-400">{title}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(items.length ? items : [emptyText]).map((item) => (
          <span key={`${title}-${item}`} className="student-chip">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
