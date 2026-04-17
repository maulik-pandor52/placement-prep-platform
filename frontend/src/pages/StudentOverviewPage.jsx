import { Link, useNavigate } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import useStudentPerformance from "../components/useStudentPerformance";
import RenderGuard from "../components/RenderGuard";
import {
  DashboardSection,
  SummaryPanel,
} from "../components/dashboard/InsightModules";
import {
  ActionLinkCard,
  MetricGrid,
  MetricStatCard,
  ScrollListPanel,
} from "../components/dashboard/DashboardBlocks";
import {
  ActivityCalendarCard,
  AnalyticsMetricGrid,
  BadgeStrip,
  RecommendationComparisonList,
} from "../components/dashboard/AnalyticsModules";
import {
  SkeletonMetricGrid,
  SkeletonSplitLayout,
} from "../components/dashboard/DashboardSkeletons";

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
    activitySummary,
    combinedAnalytics,
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

      {loading ? (
        <>
          <SkeletonMetricGrid />
          <SkeletonSplitLayout />
        </>
      ) : null}

      {!loading ? (
        <>
      <RenderGuard>
        <MetricGrid>
          <MetricStatCard
            title="Welcome Back"
            value={currentUser?.name?.split(" ")[0] || "Student"}
            meta="Resume your placement prep."
            tone="cyan"
          />
          <MetricStatCard title="Combined Score" value={`${combinedAnalytics.combinedScore || 0}%`} meta="Quiz + interview weighted" />
          <MetricStatCard title="Quiz Average" value={`${combinedAnalytics.quizAverage || 0}%`} meta={`${combinedAnalytics.quizCount || 0} attempts`} />
          <MetricStatCard title="Interview Average" value={`${combinedAnalytics.interviewAverage || 0}%`} meta={`${combinedAnalytics.interviewCount || 0} sessions`} />
          <MetricStatCard title="Readiness" value={`${combinedAnalytics.readinessScore || latestReport.readinessScore || 0}%`} meta={combinedAnalytics.performanceLevel || stats.performance} tone="violet" />
          <MetricStatCard title="Points" value={latestPoints} meta="Gamified progress total" tone="emerald" />
        </MetricGrid>
      </RenderGuard>

      <RenderGuard>
        <div className="mt-6 grid gap-6 2xl:grid-cols-[1.2fr_0.8fr]">
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
            <MetricStatCard
              title="Readiness"
              value={`${latestReport.readinessScore || 0}%`}
              meta={latestReport.readinessLevel || "Needs Work"}
              tone="violet"
            />
          </div>

          <MetricGrid className="mt-6">
            <MetricStatCard
              title="Top Chance"
              value={topCompany ? `${topCompany.selectionChance || 0}%` : "0%"}
              meta={topCompany ? `${topCompany.name} is your current best fit.` : "Company fit will appear after a quiz."}
              tone="cyan"
            />
            <MetricStatCard
              title="Benchmark Gap"
              value={`${latestReport.benchmarkGap >= 0 ? "+" : ""}${latestReport.benchmarkGap || 0}%`}
              meta="Use this to decide whether to revise basics or push into company rounds."
            />
            <MetricStatCard
              title="Badges"
              value={latestBadges.length}
              meta={latestBadges.length ? latestBadges.join(", ") : "Earn badges through consistency and company tests."}
              tone="emerald"
            />
          </MetricGrid>
        </section>

        <DashboardSection
          title="Quick Actions"
          subtitle="Move to the next workspace without crowding the overview with every detail at once."
        >
          <div className="dashboard-metric-grid">
            <ActionLinkCard
              title="Performance insights"
              text="Open trends, weak areas, peer comparison, and skill tracking."
              to="/insights"
              cta="Open Insights"
            />
            <ActionLinkCard
              title="Company opportunities"
              text="Explore company chances, market demand, and the next targeted test."
              to="/opportunities"
              cta="Open Opportunities"
            />
            <ActionLinkCard
              title="Mock interview"
              text="Practice recorded interviews and review delivery confidence feedback."
              to="/mock-interview"
              cta="Start Interview"
            />
          </div>
        </DashboardSection>
        </div>
      </RenderGuard>

      <RenderGuard>
        <div className="mt-6 grid gap-6 2xl:grid-cols-[1.08fr_0.92fr]">
        <div className="dashboard-stack">
          <ScrollListPanel
            title="Latest priorities"
            subtitle="Focus on the most important weak areas first so your next attempt improves faster."
            action={<Link to="/insights" className="ghost-btn">More analytics</Link>}
            items={latestReport.weakAreaDetails?.slice(0, 8) || []}
            emptyText="Complete a quiz to unlock your next priorities."
            renderItem={(item) => (
              <div key={`${item.type}-${item.label}`} className="student-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-100">{item.label}</div>
                  <span className="student-chip text-xs uppercase tracking-[0.18em]">
                    {item.severity}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-400">{item.reason}</p>
              </div>
            )}
          />

          <RecommendationComparisonList
            title="Company fit analysis"
            subtitle="See how your combined score compares with current company demand before choosing the next test."
            items={(combinedAnalytics.companyRecommendations || []).slice(0, 4)}
          />

          <DashboardSection
            title="Recent activity"
            subtitle="Keep quiz history and interview practice visible without letting long lists take over the page."
            action={<Link to="/result" className="ghost-btn">View all results</Link>}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <ActivityColumn
                title="Quiz Attempts"
                items={results.slice(0, 8)}
                emptyText="No attempts yet."
                renderItem={(item) => (
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
                )}
              />
              <ActivityColumn
                title="Interview Sessions"
                items={interviewHistory.slice(0, 8)}
                emptyText="No interview practice yet."
                renderItem={(session) => (
                  <div key={session._id} className="rounded-[20px] border border-slate-700/50 px-4 py-3">
                    <div className="font-semibold text-slate-100">
                      {session.company || "General"} / {session.role || "Interview"}
                    </div>
                    <div className="mt-1 text-sm text-slate-400">
                      Score {session.overallScore || 0}% / Confidence {session.confidenceScore || 0}%
                    </div>
                  </div>
                )}
              />
            </div>
          </DashboardSection>
        </div>

        <aside className="dashboard-stack">
          <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-1">
            <DashboardSection
              title="Combined result insights"
              subtitle="A single view of quiz results, mock interviews, and progress movement."
            >
              <AnalyticsMetricGrid
                items={[
                  {
                    title: "Performance Level",
                    value: combinedAnalytics.performanceLevel || "Beginner",
                    meta: "Automatic level based on combined performance",
                    tone: "violet",
                  },
                  {
                    title: "Progress Check",
                    value:
                      combinedAnalytics.progressCheck?.delta === null
                        ? "New"
                        : `${combinedAnalytics.progressCheck?.delta >= 0 ? "+" : ""}${combinedAnalytics.progressCheck?.delta}%`,
                    meta:
                      combinedAnalytics.progressCheck?.delta === null
                        ? "Need more runs for comparison"
                        : "Compared with your previous combined result",
                    tone: "cyan",
                  },
                  {
                    title: "Active Days",
                    value: activitySummary.totalActiveDays || 0,
                    meta: `Current streak ${activitySummary.currentStreak || 0} days`,
                    tone: "emerald",
                  },
                ]}
              />
            </DashboardSection>

            <ScrollListPanel
              title="Leaderboard snapshot"
              subtitle="See the current top performers without overloading the main workspace."
              items={leaderboard.slice(0, 8)}
              emptyText="Leaderboard data will appear here."
              renderItem={(entry, index) => (
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
              )}
            />
          </div>

          <DashboardSection
            title="Latest report summary"
            subtitle="A compact snapshot of strengths, weak points, and what to practice next."
            kicker="Summary"
          >
            <div className="summary-grid">
              <SummaryPanel title="Strengths" items={latestReport.strengths} tone="success" />
              <SummaryPanel title="Weaknesses" items={latestReport.weaknesses} tone="warning" />
              <SummaryPanel title="Tips" items={latestReport.tips} tone="info" />
            </div>
          </DashboardSection>

          <div className="grid gap-6 xl:grid-cols-2 2xl:grid-cols-1">
            <ActivityCalendarCard
              days={activitySummary.calendar || []}
              totalActiveDays={activitySummary.totalActiveDays || 0}
              currentStreak={activitySummary.currentStreak || 0}
              longestStreak={activitySummary.longestStreak || 0}
              title="Activity Calendar"
              subtitle="Track login, quiz, and interview activity without leaving the dashboard."
            />

            <BadgeStrip badges={latestBadges} title="Achievements" />
          </div>
        </aside>
        </div>
      </RenderGuard>
        </>
      ) : null}
    </StudentLayout>
  );
}

function ActivityColumn({ title, items, renderItem, emptyText }) {
  return (
    <div className="student-card">
      <div className="text-sm uppercase tracking-[0.2em] text-slate-400">{title}</div>
      {items?.length ? (
        <div className="panel-stack panel-scroll mt-4">{items.map(renderItem)}</div>
      ) : (
        <div className="summary-empty mt-4">{emptyText}</div>
      )}
    </div>
  );
}
