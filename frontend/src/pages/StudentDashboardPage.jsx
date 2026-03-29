import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import StudentLayout from "../components/StudentLayout";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const [results, setResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [skillTracker, setSkillTracker] = useState({
    trackedSkills: [],
    recommendedFocus: [],
    peerComparison: {
      cohortSize: 0,
      averageScore: 0,
      yourScore: 0,
      percentile: 0,
      rank: 0,
      strengthsVsPeers: [],
      needsVsPeers: [],
      skillComparison: [],
    },
    industryTrends: [],
  });
  const [interviewHistory, setInterviewHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [resultsRes, leaderboardRes, skillTrackerRes, interviewHistoryRes] =
          await Promise.all([
            axios.get("http://localhost:5000/api/quiz/results", {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            }),
            axios.get("http://localhost:5000/api/quiz/leaderboard", {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            }),
            axios.get("http://localhost:5000/api/quiz/skill-tracker", {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            }),
            axios.get("http://localhost:5000/api/interview/history", {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 10000,
            }),
          ]);

        const sorted = [...(resultsRes.data || [])].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );

        setResults(sorted);
        setLeaderboard(leaderboardRes.data || []);
        setSkillTracker(
          skillTrackerRes.data || {
            trackedSkills: [],
            recommendedFocus: [],
            peerComparison: {
              cohortSize: 0,
              averageScore: 0,
              yourScore: 0,
              percentile: 0,
              rank: 0,
              strengthsVsPeers: [],
              needsVsPeers: [],
              skillComparison: [],
            },
            industryTrends: [],
          },
        );
        setInterviewHistory(interviewHistoryRes.data || []);
      } catch (err) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
        } else {
          setError(
            err.response?.data?.message ||
              "Could not load your dashboard. Please try again later.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [navigate]);

  const stats = useMemo(() => {
    if (!results.length) {
      return {
        totalQuizzes: 0,
        highestScore: 0,
        averageScore: "0.0",
        performance: "No attempts yet",
      };
    }

    const scores = results.map((r) => r.score);
    const totalQuizzes = results.length;
    const highestScore = Math.max(...scores);
    const averageScore = (
      scores.reduce((sum, score) => sum + score, 0) / totalQuizzes
    ).toFixed(1);

    const averagePercentage =
      results.reduce((sum, item) => sum + (item.score / (item.total || 1)) * 100, 0) /
      totalQuizzes;

    let performance = "Needs Practice";
    if (averagePercentage >= 80) performance = "Excellent";
    else if (averagePercentage >= 65) performance = "Good";
    else if (averagePercentage >= 50) performance = "Average";

    return {
      totalQuizzes,
      highestScore,
      averageScore,
      performance,
    };
  }, [results]);

  const latestReport = results[0]?.report || {};
  const latestPoints = latestReport.totalPoints || currentUser?.points || 0;
  const latestBadges = latestReport.badgesEarned || currentUser?.badges || [];
  const readinessGap = latestReport.benchmarkGap || 0;

  const chartData = useMemo(
    () => ({
      labels: results.map((_, i) => `Attempt ${results.length - i}`),
      datasets: [
        {
          label: "Score (%)",
          data: results.map((r) => ((r.score / (r.total || 1)) * 100).toFixed(0)),
          backgroundColor: "rgba(15, 118, 110, 0.75)",
          borderRadius: 14,
        },
      ],
    }),
    [results],
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Performance Trend",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
      },
    },
  };

  return (
    <StudentLayout
      title="Your progress, practice, and interview prep in one place."
      subtitle="Use your dashboard to understand performance, choose your next quiz, and stay consistent with focused improvement."
      actions={
        <>
          <Link to="/quiz" className="primary-btn">
            Start Quiz
          </Link>
          <Link to="/mock-interview" className="secondary-btn">
            Mock Interview
          </Link>
        </>
      }
    >
      {error ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Total Attempts" value={stats.totalQuizzes} />
        <MetricCard title="Highest Score" value={stats.highestScore} />
        <MetricCard title="Average Score" value={stats.averageScore} />
        <MetricCard title="Performance" value={stats.performance} />
        <MetricCard title="Points" value={latestPoints} />
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <MetricCard title="Readiness Score" value={`${latestReport.readinessScore || 0}%`} />
        <MetricCard title="Readiness Level" value={latestReport.readinessLevel || "Needs Work"} />
        <MetricCard
          title="Benchmark Gap"
          value={`${readinessGap >= 0 ? "+" : ""}${readinessGap}%`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="section-panel h-[420px]">
          <h2 className="text-2xl font-black text-slate-900">Score Trend</h2>
          <p className="mt-2 text-sm text-slate-500">
            See how your quiz performance changes over time.
          </p>
          <div className="mt-6 h-[300px]">
            {loading ? (
              <div className="flex h-full items-center justify-center text-slate-500">
                Loading chart...
              </div>
            ) : results.length ? (
              <Bar data={chartData} options={chartOptions} />
            ) : (
              <div className="flex h-full items-center justify-center rounded-[24px] border border-dashed border-slate-200 text-slate-500">
                Take your first quiz to unlock your trend view.
              </div>
            )}
          </div>
        </section>

        <section className="section-panel">
          <h2 className="text-2xl font-black text-slate-900">Leaderboard</h2>
          <div className="mt-5 space-y-3">
            {leaderboard.length ? (
              leaderboard.slice(0, 6).map((entry, index) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between rounded-[22px] border border-slate-100 bg-white/80 px-4 py-3"
                >
                  <div>
                    <div className="font-semibold text-slate-900">
                      #{index + 1} {entry.name}
                    </div>
                    <div className="text-sm text-slate-500">
                      {entry.totalQuizzes || 0} quizzes
                    </div>
                  </div>
                  <div className="soft-badge">{entry.points || 0} pts</div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No leaderboard data yet.</p>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="section-panel">
          <h2 className="text-2xl font-black text-slate-900">Badges</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {latestBadges.length ? (
              latestBadges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800"
                >
                  {badge}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Finish quizzes and company tests to unlock badges.
              </p>
            )}
          </div>
        </section>

        <section className="section-panel">
          <h2 className="text-2xl font-black text-slate-900">Current Rewards</h2>
          <div className="mt-5 grid gap-4">
            <RewardTile label="Latest Points Earned" value={`+${latestReport.pointsEarned || 0}`} />
            <RewardTile label="Unlocked Badges" value={String(latestBadges.length)} />
          </div>
        </section>

        <section className="section-panel">
          <h2 className="text-2xl font-black text-slate-900">Recent Attempts</h2>
          <div className="mt-5 space-y-3">
            {results.length ? (
              results.slice(0, 5).map((item) => (
                <div
                  key={item._id}
                  className="rounded-[22px] border border-slate-100 bg-white/80 px-4 py-3"
                >
                  <div className="font-semibold text-slate-900">
                    {item.score} / {item.total}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {item.testType === "company" && item.company
                      ? `${item.company} test`
                      : "Initial test"}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No attempts yet.</p>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="section-panel">
          <h2 className="text-2xl font-black text-slate-900">Latest Report</h2>
          {!results[0]?.report ? (
            <p className="mt-4 text-sm text-slate-500">
              Complete a quiz to see strengths, weaknesses, and tips here.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ChipGroup title="Strengths" items={results[0].report.strengths} tone="green" />
              <ChipGroup title="Weaknesses" items={results[0].report.weaknesses} tone="orange" />
              <ChipGroup
                title="Tips"
                items={results[0].report.tips}
                tone="blue"
                multiline
              />
            </div>
          )}
        </section>

        <section className="section-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Skill Tracker</h2>
              <p className="mt-2 text-sm text-slate-500">
                See the skills that need more attention.
              </p>
            </div>
            <Link to="/quiz" className="secondary-btn">
              Practice More
            </Link>
          </div>
          <div className="mt-5 space-y-4">
            {skillTracker.trackedSkills.length ? (
              skillTracker.trackedSkills.slice(0, 5).map((skill) => (
                <div key={skill.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">{skill.label}</span>
                    <span className="text-slate-500">{skill.latest}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-teal-600"
                      style={{ width: `${skill.latest}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Complete more quizzes to unlock skill trends.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="section-panel">
          <h2 className="text-2xl font-black text-slate-900">Readiness Summary</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            {latestReport.readinessSummary ||
              "Complete a quiz to generate a deeper readiness summary."}
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <RewardTile
              label="Target Benchmark"
              value={`${latestReport.benchmarkScore || 0}%`}
            />
            <RewardTile
              label="Category Insights"
              value={String(latestReport.categoryInsights?.length || 0)}
            />
          </div>
        </section>

        <section className="section-panel">
          <h2 className="text-2xl font-black text-slate-900">Roadmap</h2>
          <div className="mt-5 space-y-3">
            {(latestReport.improvementRoadmap?.length
              ? latestReport.improvementRoadmap
              : ["Your next steps will appear after the next completed quiz."]).map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-teal-100 bg-teal-50/70 px-4 py-3 text-sm leading-7 text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="section-panel">
          <h2 className="text-2xl font-black text-slate-900">Skill Gap Analysis</h2>
          <div className="mt-5 space-y-4">
            {latestReport.skillGapAnalysis?.length ? (
              latestReport.skillGapAnalysis.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">{item.label}</span>
                    <span className="text-slate-500">
                      {item.currentScore}% / target {item.targetScore}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-100">
                    <div
                      className="h-3 rounded-full bg-teal-600"
                      style={{ width: `${Math.min(item.currentScore, 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 text-sm text-slate-500">
                    Gap remaining: {item.gap}% / Priority {item.priority}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Complete a quiz to see company-aligned skill gaps.
              </p>
            )}
          </div>
        </section>

        <section className="section-panel">
          <h2 className="text-2xl font-black text-slate-900">Category Insights</h2>
          <div className="mt-5 space-y-3">
            {(latestReport.categoryInsights?.length
              ? latestReport.categoryInsights
              : ["Category-level insights will appear after your next completed quiz."]).map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm leading-7 text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="section-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Peer Comparison</h2>
              <p className="mt-2 text-sm text-slate-500">
                Compare your latest readiness against the current student cohort.
              </p>
            </div>
            <div className="soft-badge">
              {skillTracker.peerComparison?.cohortSize || 0} students
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <RewardTile
              label="Your Score"
              value={`${skillTracker.peerComparison?.yourScore || 0}%`}
            />
            <RewardTile
              label="Peer Average"
              value={`${skillTracker.peerComparison?.averageScore || 0}%`}
            />
            <RewardTile
              label="Percentile"
              value={`${skillTracker.peerComparison?.percentile || 0}th`}
            />
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <SimpleListCard
              title="Ahead of Peers In"
              items={skillTracker.peerComparison?.strengthsVsPeers}
              emptyText="More peer-comparison data will appear after more attempts."
              tone="green"
            />
            <SimpleListCard
              title="Needs More Work"
              items={skillTracker.peerComparison?.needsVsPeers}
              emptyText="No major peer gap detected right now."
              tone="orange"
            />
          </div>

          <div className="mt-6 space-y-4">
            {(skillTracker.peerComparison?.skillComparison || []).map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-slate-800">{item.label}</span>
                  <span className="text-slate-500">
                    You {item.yourScore}% / Peers {item.peerAverage}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-teal-600"
                    style={{ width: `${Math.min(item.yourScore, 100)}%` }}
                  />
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  Gap: {item.gap >= 0 ? "+" : ""}
                  {item.gap}% / Percentile {item.percentile}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section-panel">
          <h2 className="text-2xl font-black text-slate-900">Industry Trends</h2>
          <p className="mt-2 text-sm text-slate-500">
            See which skills and company benchmarks are currently most in demand.
          </p>
          <div className="mt-5 space-y-4">
            {(skillTracker.industryTrends || []).length ? (
              skillTracker.industryTrends.map((trend) => (
                <div
                  key={trend.company}
                  className="rounded-[24px] border border-slate-100 bg-white/80 p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold text-slate-900">
                        {trend.company}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {trend.industry}
                      </div>
                    </div>
                    <div className="soft-badge">{trend.growthLabel}</div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-[20px] border border-teal-100 bg-teal-50/70 px-4 py-3">
                      <div className="text-sm text-teal-700">Top Skill</div>
                      <div className="mt-2 text-xl font-black text-slate-900">
                        {trend.topSkill}
                      </div>
                    </div>
                    <div className="rounded-[20px] border border-sky-100 bg-sky-50/70 px-4 py-3">
                      <div className="text-sm text-sky-700">Demand Score</div>
                      <div className="mt-2 text-xl font-black text-slate-900">
                        {trend.demandScore}%
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-sm text-slate-600">
                    Benchmark target: {trend.benchmarkScore}% / Typical rounds:{" "}
                    {trend.topRoles?.join(", ")}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    {trend.liveOpenings ? `Live openings: ${trend.liveOpenings}` : "Live openings unavailable"}{" "}
                    / {trend.averageSalary ? `Avg salary: ${trend.averageSalary}` : "Salary not reported"}{" "}
                    / {trend.topLocation ? `Top location: ${trend.topLocation}` : ""}
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    {trend.sourceLabel}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Industry-trend data will appear after the first company datasets load.
              </p>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <section className="section-panel">
          <h2 className="text-2xl font-black text-slate-900">Suggested Companies</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {results[0]?.report?.companySuggestions?.length ? (
              results[0].report.companySuggestions.map((company) => (
                <div
                  key={company.name}
                  className="rounded-[24px] border border-teal-100 bg-teal-50/70 p-4"
                >
                  <div className="text-lg font-semibold text-slate-900">{company.name}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {company.matchReason}
                  </p>
                  <Link
                    to={`/quiz?company=${encodeURIComponent(company.name)}`}
                    className="primary-btn mt-4"
                  >
                    Take Company Test
                  </Link>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">
                Finish a quiz to unlock company suggestions.
              </p>
            )}
          </div>
        </section>

        <section className="section-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Mock Interview</h2>
              <p className="mt-2 text-sm text-slate-500">
                Practice interview answers and review recent sessions.
              </p>
            </div>
            <Link to="/mock-interview" className="primary-btn">
              Start Interview
            </Link>
          </div>
          <div className="mt-5 space-y-3">
            {interviewHistory.length ? (
              interviewHistory.slice(0, 4).map((session) => (
                <div
                  key={session._id}
                  className="rounded-[22px] border border-slate-100 bg-white/80 px-4 py-3"
                >
                  <div className="font-semibold text-slate-900">
                    {session.company || "General"} / {session.role || "Interview"}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    Skill: {session.skill || "General"} / Score: {session.overallScore}%
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No interview sessions yet.</p>
            )}
          </div>
        </section>
      </div>
    </StudentLayout>
  );
}

function MetricCard({ title, value }) {
  return (
    <div className="metric-tile">
      <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {title}
      </div>
      <div className="mt-3 text-4xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function RewardTile({ label, value }) {
  return (
    <div className="rounded-[22px] border border-teal-100 bg-teal-50/70 px-4 py-4">
      <div className="text-sm text-teal-700">{label}</div>
      <div className="mt-2 text-3xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function ChipGroup({ title, items = [], tone, multiline = false }) {
  const toneClasses = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    blue: "border-sky-200 bg-sky-50 text-sky-700",
  };

  return (
    <div>
      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </div>
      {multiline ? (
        <div className="mt-3 space-y-3">
          {(items?.length ? items : ["No items yet."]).map((item) => (
            <div
              key={`${title}-${item}`}
              className={`rounded-[22px] border px-4 py-3 text-sm leading-7 ${toneClasses[tone]}`}
            >
              {item}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {(items?.length ? items : ["No items yet."]).map((item) => (
            <span
              key={`${title}-${item}`}
              className={`max-w-full break-words rounded-full border px-3 py-1 text-sm font-medium ${toneClasses[tone]}`}
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function SimpleListCard({ title, items = [], emptyText, tone }) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
  };

  return (
    <div>
      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(items.length ? items : [emptyText]).map((item) => (
          <span
            key={`${title}-${item}`}
            className={`max-w-full break-words rounded-full border px-3 py-1 text-sm font-medium ${tones[tone]}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

