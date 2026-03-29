import { Link, useNavigate } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import useStudentPerformance from "../components/useStudentPerformance";

export default function StudentOverviewPage() {
  const navigate = useNavigate();
  const {
    currentUser,
    results,
    leaderboard,
    interviewHistory,
    error,
    loading,
    stats,
    latestReport,
    latestPoints,
    latestBadges,
  } = useStudentPerformance({ navigate });

  const latestResult = results[0];
  const topCompany = latestReport.companySuggestions?.[0];

  return (
    <StudentLayout
      title="Your overview workspace"
      subtitle="See your current momentum, latest readiness, and the next move to make without crowding every feature into one page."
      actions={
        <>
          <Link to="/quiz" className="primary-btn">
            Start Quiz
          </Link>
          <Link to="/insights" className="secondary-btn">
            Open Insights
          </Link>
        </>
      }
    >
      {error ? (
        <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Welcome Back" value={currentUser?.name?.split(" ")[0] || "Student"} />
        <MetricCard title="Attempts" value={stats.totalQuizzes} />
        <MetricCard title="Average Score" value={stats.averageScore} />
        <MetricCard title="Performance" value={stats.performance} />
        <MetricCard title="Points" value={latestPoints} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="section-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="soft-badge">Latest Attempt</div>
              <h2 className="mt-4 panel-title">
                {latestResult
                  ? `${latestResult.score}/${latestResult.total} on your latest quiz`
                  : "No quiz attempts yet"}
              </h2>
              <p className="mt-3 text-sm leading-7 muted-copy">
                {latestReport.performanceSummary ||
                  "Start with one focused quiz to unlock readiness, company suggestions, and performance analytics."}
              </p>
            </div>
            <div className="student-card min-w-[220px]">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                Readiness
              </div>
              <div className="mt-3 text-4xl font-black text-slate-100">
                {latestReport.readinessScore || 0}%
              </div>
              <div className="mt-2 text-sm text-slate-400">
                {latestReport.readinessLevel || "Needs Work"}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <TintCard
              title="Top Chance"
              value={topCompany ? `${topCompany.selectionChance || 0}%` : "0%"}
              text={topCompany ? `${topCompany.name} is your current best fit.` : "Company fit will appear after a quiz."}
            />
            <TintCard
              title="Benchmark Gap"
              value={`${latestReport.benchmarkGap >= 0 ? "+" : ""}${latestReport.benchmarkGap || 0}%`}
              text="Use this gap to decide whether to revise basics or push into company rounds."
            />
            <TintCard
              title="Badges"
              value={latestBadges.length}
              text={latestBadges.length ? latestBadges.join(", ") : "Earn badges through consistency and company tests."}
            />
          </div>
        </section>

        <section className="section-panel">
          <h2 className="panel-title">Quick Actions</h2>
          <div className="mt-5 grid gap-3">
            <Link to="/insights" className="student-card transition hover:border-cyan-300/25">
              <div className="text-lg font-semibold text-slate-100">Performance insights</div>
              <div className="mt-2 text-sm leading-7 text-slate-400">
                Open trends, weak areas, peer comparison, and skill tracking.
              </div>
            </Link>
            <Link to="/opportunities" className="student-card transition hover:border-cyan-300/25">
              <div className="text-lg font-semibold text-slate-100">Company opportunities</div>
              <div className="mt-2 text-sm leading-7 text-slate-400">
                Explore company chances, market demand, and the next targeted test.
              </div>
            </Link>
            <Link to="/mock-interview" className="student-card transition hover:border-cyan-300/25">
              <div className="text-lg font-semibold text-slate-100">Mock interview</div>
              <div className="mt-2 text-sm leading-7 text-slate-400">
                Practice recorded interviews and review delivery confidence feedback.
              </div>
            </Link>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="section-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="panel-title">Latest priorities</h2>
            <Link to="/insights" className="ghost-btn">
              More analytics
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {(latestReport.weakAreaDetails?.length
              ? latestReport.weakAreaDetails.slice(0, 3)
              : []).map((item) => (
              <div key={`${item.type}-${item.label}`} className="student-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-100">{item.label}</div>
                  <span className="student-chip text-xs uppercase tracking-[0.18em]">
                    {item.severity}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.reason}</p>
              </div>
            ))}
            {!latestReport.weakAreaDetails?.length ? (
              <div className="empty-state">Complete a quiz to unlock your next priorities.</div>
            ) : null}
          </div>
        </section>

        <section className="section-panel">
          <div className="flex items-center justify-between gap-3">
            <h2 className="panel-title">Recent activity</h2>
            <Link to="/result" className="ghost-btn">
              View all results
            </Link>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="student-card">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Quiz Attempts
              </div>
              <div className="mt-4 space-y-3">
                {results.slice(0, 4).map((item) => (
                  <div key={item._id} className="rounded-[20px] border border-slate-700/50 px-4 py-3">
                    <div className="font-semibold text-slate-100">
                      {item.score}/{item.total}
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      {item.testType === "company" && item.company
                        ? `${item.company} company round`
                        : "Initial readiness quiz"}
                    </div>
                  </div>
                ))}
                {!results.length ? <div className="empty-state">No attempts yet.</div> : null}
              </div>
            </div>

            <div className="student-card">
              <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Interview Sessions
              </div>
              <div className="mt-4 space-y-3">
                {interviewHistory.slice(0, 4).map((session) => (
                  <div key={session._id} className="rounded-[20px] border border-slate-700/50 px-4 py-3">
                    <div className="font-semibold text-slate-100">
                      {session.company || "General"} / {session.role || "Interview"}
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      Score {session.overallScore || 0}% / Confidence {session.confidenceScore || 0}%
                    </div>
                  </div>
                ))}
                {!interviewHistory.length ? (
                  <div className="empty-state">No interview practice yet.</div>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="section-panel">
          <h2 className="panel-title">Leaderboard snapshot</h2>
          <div className="mt-5 space-y-3">
            {leaderboard.slice(0, 5).map((entry, index) => (
              <div key={entry._id} className="student-card flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-100">
                    #{index + 1} {entry.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    {entry.totalQuizzes || 0} quizzes completed
                  </div>
                </div>
                <div className="student-chip">{entry.points || 0} pts</div>
              </div>
            ))}
            {!leaderboard.length ? <div className="empty-state">Leaderboard data will appear here.</div> : null}
          </div>
        </section>

        <section className="section-panel">
          <h2 className="panel-title">Latest report summary</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <GroupCard title="Strengths" items={latestReport.strengths} />
            <GroupCard title="Weaknesses" items={latestReport.weaknesses} />
            <GroupCard title="Tips" items={latestReport.tips} />
          </div>
        </section>
      </div>

      {loading ? <div className="mt-6 empty-state">Refreshing your latest performance data...</div> : null}
    </StudentLayout>
  );
}

function MetricCard({ title, value }) {
  return (
    <div className="metric-tile">
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
        {title}
      </div>
      <div className="mt-3 text-4xl font-black text-slate-100">{value}</div>
    </div>
  );
}

function TintCard({ title, value, text }) {
  return (
    <div className="student-tint">
      <div className="text-sm uppercase tracking-[0.2em] text-cyan-300">{title}</div>
      <div className="mt-3 text-3xl font-black text-slate-100">{value}</div>
      <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
    </div>
  );
}

function GroupCard({ title, items = [] }) {
  return (
    <div className="student-card">
      <div className="text-sm uppercase tracking-[0.2em] text-slate-400">{title}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        {(items?.length ? items : ["No items yet"]).map((item) => (
          <span key={`${title}-${item}`} className="student-chip">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
