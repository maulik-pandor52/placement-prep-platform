import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import useStudentPerformance from "../components/useStudentPerformance";
import { authService } from "../services/authService";

export default function StudentProfilePage() {
  const navigate = useNavigate();
  const {
    currentUser,
    results,
    latestReport,
    combinedAnalytics,
    latestBadges,
    latestPoints,
    stats,
    activitySummary,
    loading: performanceLoading,
  } = useStudentPerformance({ navigate });
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService
      .getProfile()
      .then((res) => setProfile(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const user = profile?.user || currentUser || {};
  const latestResult = results[0] || null;
  const latestPercentage =
    latestResult?.total > 0 ? Math.round((latestResult.score / latestResult.total) * 100) : 0;

  return (
    <StudentLayout
      title="Your profile"
      subtitle="Keep your account details, activity, and latest results together in one place."
      actions={
        <>
          <Link to="/dashboard" className="secondary-btn">
            Back to Dashboard
          </Link>
          <Link to="/quiz" className="primary-btn">
            Start Practice
          </Link>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="section-panel">
          <div className="soft-badge">Account</div>
          <h2 className="mt-4 panel-title">{user.name || "Student"}</h2>
          <p className="mt-2 text-sm text-slate-400">{user.email || "No email available"}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ProfileInfoCard title="Role" value={user.role || "student"} />
            <ProfileInfoCard
              title="Joined"
              value={
                profile?.user?.createdAt
                  ? new Date(profile.user.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Recently"
              }
            />
            <ProfileInfoCard title="Current Streak" value={`${activitySummary.currentStreak || 0} days`} />
            <ProfileInfoCard title="Longest Streak" value={`${activitySummary.longestStreak || 0} days`} />
          </div>
        </section>

        <section className="section-panel">
          <div className="soft-badge">Progress Snapshot</div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ProfileInfoCard title="Total Points" value={String(latestPoints || 0)} />
            <ProfileInfoCard title="Quizzes Completed" value={String(stats.totalQuizzes || 0)} />
            <ProfileInfoCard title="Highest Score" value={String(stats.highestScore || 0)} />
            <ProfileInfoCard title="Average Score" value={String(stats.averageScore || "0.0")} />
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-700/50 bg-slate-900/45 p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Badges
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {latestBadges.length ? (
                latestBadges.map((badge) => (
                  <span key={badge} className="achievement-badge">
                    {badge}
                  </span>
                ))
              ) : (
                <div className="summary-empty w-full">No badges yet. Keep practicing to unlock them.</div>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="section-panel">
          <div className="soft-badge">Latest Result</div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <ProfileInfoCard
              title="Latest Score"
              value={
                latestResult
                  ? `${latestResult.score}/${latestResult.total}`
                  : "No result yet"
              }
            />
            <ProfileInfoCard title="Latest Percentage" value={`${latestPercentage}%`} />
            <ProfileInfoCard
              title="Combined Score"
              value={`${combinedAnalytics.combinedScore || 0}%`}
            />
            <ProfileInfoCard
              title="Readiness"
              value={`${combinedAnalytics.readinessScore || latestReport.readinessScore || 0}%`}
            />
          </div>

          <div className="mt-6 rounded-[24px] border border-slate-700/50 bg-slate-900/45 p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Latest Summary
            </div>
            <div className="mt-4 text-sm leading-7 text-slate-300">
              {latestReport.performanceSummary ||
                latestReport.readinessSummary ||
                "Complete a quiz to show your latest performance summary here."}
            </div>
          </div>
        </section>

        <section className="section-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="soft-badge">Result History</div>
              <h2 className="mt-4 panel-title">Recent attempts</h2>
            </div>
            <Link to="/quiz" className="secondary-btn">
              Practice Again
            </Link>
          </div>

          <div className="panel-scroll mt-5 space-y-4">
            {results.length ? (
              results.slice(0, 8).map((item) => {
                const percentage =
                  item.total > 0 ? Math.round((item.score / item.total) * 100) : 0;

                return (
                  <div key={item._id} className="student-card">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-slate-100">
                          {item.testType === "company" && item.company
                            ? `${item.company} company test`
                            : "Initial readiness quiz"}
                        </div>
                        <div className="mt-2 text-sm text-slate-400">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "No date"}
                        </div>
                      </div>
                      <div className="student-chip">{percentage}%</div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      <div className="student-tint">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Score
                        </div>
                        <div className="mt-2 text-2xl font-black text-slate-100">
                          {item.score}/{item.total}
                        </div>
                      </div>
                      <div className="student-tint">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Readiness
                        </div>
                        <div className="mt-2 text-2xl font-black text-slate-100">
                          {item.report?.readinessScore || 0}%
                        </div>
                      </div>
                      <div className="student-tint">
                        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Level
                        </div>
                        <div className="mt-2 text-xl font-black text-slate-100">
                          {item.report?.readinessLevel || "Needs Work"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">No saved results yet. Start your first quiz to fill this section.</div>
            )}
          </div>
        </section>
      </div>

      {loading || performanceLoading ? (
        <div className="mt-6 empty-state">Refreshing your profile and activity data...</div>
      ) : null}
    </StudentLayout>
  );
}

function ProfileInfoCard({ title, value }) {
  return (
    <div className="student-card">
      <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</div>
      <div className="mt-3 text-2xl font-black text-slate-100">{value}</div>
    </div>
  );
}
