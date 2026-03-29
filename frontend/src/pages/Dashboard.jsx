import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

export default function Dashboard() {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const [results, setResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [skillTracker, setSkillTracker] = useState({
    trackedSkills: [],
    recommendedFocus: [],
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

        // Sort newest first
        const sorted = [...(resultsRes.data || [])].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
        );

        setResults(sorted);
        setLeaderboard(leaderboardRes.data || []);
        setSkillTracker(skillTrackerRes.data || { trackedSkills: [], recommendedFocus: [] });
        setInterviewHistory(interviewHistoryRes.data || []);
      } catch (err) {
        console.error("Failed to load quiz results:", err);

        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
        } else {
          setError(
            err.response?.data?.message ||
              "Could not load your quiz history. Please try again later.",
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  // Memoized stats (avoid recalculating on every render)
  const stats = useMemo(() => {
    if (!results.length) {
      return {
        totalQuizzes: 0,
        highestScore: 0,
        averageScore: "0.0",
        averagePercentage: 0,
        performance: "No attempts yet",
      };
    }

    const scores = results.map((r) => r.score);
    const totals = results.map((r) => r.total || 10); // fallback

    const totalQuizzes = results.length;
    const highestScore = Math.max(...scores);
    const sumScores = scores.reduce((a, b) => a + b, 0);
    const averageScore = (sumScores / totalQuizzes).toFixed(1);

    const percentages = results.map(
      (r, i) => (r.score / (totals[i] || 10)) * 100,
    );
    const avgPercentage = (
      percentages.reduce((a, b) => a + b, 0) / totalQuizzes
    ).toFixed(0);

    let performance = "Needs Practice";
    if (avgPercentage >= 80) performance = "Excellent";
    else if (avgPercentage >= 65) performance = "Good";
    else if (avgPercentage >= 50) performance = "Average";

    return {
      totalQuizzes,
      highestScore,
      averageScore,
      avgPercentage,
      performance,
    };
  }, [results]);

  const latestReport = results[0]?.report || {};
  const latestPoints = latestReport.totalPoints || currentUser?.points || 0;
  const latestBadges = latestReport.badgesEarned || [];

  const chartData = useMemo(
    () => ({
      labels: results.map((_, i) => `Attempt ${results.length - i}`), // newest on right
      datasets: [
        {
          label: "Score (%)",
          data: results.map((r) =>
            ((r.score / (r.total || 10)) * 100).toFixed(0),
          ),
          backgroundColor: "rgba(59, 130, 246, 0.65)",
          borderColor: "rgba(59, 130, 246, 0.9)",
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    }),
    [results],
  );

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800 },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: { display: true, text: "Percentage (%)", color: "#4b5563" },
        ticks: { stepSize: 20 },
      },
      x: {
        title: { display: true, text: "Attempts (newest →)", color: "#4b5563" },
      },
    },
    plugins: {
      legend: { position: "top", labels: { color: "#374151" } },
      title: {
        display: true,
        text: "Your Quiz Performance Trend",
        color: "#1f2937",
        font: { size: 18 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${ctx.parsed.y}% (${results[ctx.dataIndex]?.score || "?"} correct)`,
        },
      },
    },
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-72 lg:w-80 flex-col bg-gradient-to-b from-blue-700 to-blue-800 text-white">
        <div className="p-6 border-b border-blue-600">
          <h2 className="text-2xl font-bold">Placement Prep</h2>
          <p className="text-blue-200 text-sm mt-1">
            Track • Improve • Succeed
          </p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          <Link
            to="/dashboard"
            className="flex items-center px-4 py-3 rounded-lg bg-blue-900/70 font-medium"
          >
            Dashboard
          </Link>
          <Link
            to="/quiz"
            className="flex items-center px-4 py-3 rounded-lg hover:bg-blue-600/50 transition"
          >
            Take Quiz
          </Link>
          <Link
            to="/result"
            className="flex items-center px-4 py-3 rounded-lg hover:bg-blue-600/50 transition"
          >
            All Results
          </Link>
        </nav>

        <div className="p-6 border-t border-blue-600">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 py-3 px-4 rounded-lg transition font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-5 sm:p-8 lg:p-10 overflow-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-800">Your Dashboard</h1>
          <div className="flex gap-3">
            {currentUser?.role === "admin" && (
              <Link
                to="/admin"
                className="bg-white text-blue-700 border border-blue-200 px-5 py-2.5 rounded-lg font-medium shadow-sm transition hover:bg-blue-50"
              >
                Admin Panel
              </Link>
            )}
            <Link
              to="/quiz"
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition"
            >
              Start Quiz
            </Link>
          </div>
        </header>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-5 rounded-xl">
            {error}
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
              <StatCard
                title="Total Attempts"
                value={stats.totalQuizzes}
                color="blue"
              />
              <StatCard
                title="Highest Score"
                value={stats.highestScore}
                color="green"
              />
              <StatCard
                title="Average Score"
                value={stats.averageScore}
                color="purple"
              />
              <StatCard
                title="Performance"
                value={stats.performance}
                color="amber"
                isText
              />
              <StatCard title="Points" value={latestPoints} color="blue" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart */}
              <div className="bg-white rounded-xl shadow-md p-6 h-96 flex flex-col lg:col-span-2">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Score Trend
                </h2>
                {results.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    Start taking quizzes to see your progress!
                  </div>
                ) : (
                  <div className="flex-1">
                    <Bar data={chartData} options={chartOptions} />
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Leaderboard
                </h2>
                {leaderboard.length === 0 ? (
                  <p className="text-gray-500">No leaderboard data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry._id}
                        className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
                      >
                        <div>
                          <div className="font-medium text-gray-800">
                            #{index + 1} {entry.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.totalQuizzes || 0} quizzes • {entry.badges?.length || 0} badges
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-blue-700">
                          {entry.points || 0} pts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="rounded-xl bg-white p-6 shadow-md">
                <h2 className="text-xl font-semibold text-gray-800">Badges</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {latestBadges.length ? (
                    latestBadges.map((badge) => (
                      <span
                        key={badge}
                        className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800"
                      >
                        {badge}
                      </span>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">
                      Finish quizzes and company tests to unlock badges.
                    </p>
                  )}
                </div>
              </div>

              {/* Recent Attempts */}
              <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Recent Attempts
                </h2>
                {results.length === 0 ? (
                  <p className="text-gray-500 flex-1 flex items-center">
                    No quiz attempts yet. Take your first quiz!
                  </p>
                ) : (
                  <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                    {results.slice(0, 8).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-lg border border-gray-100 transition"
                      >
                        <div className="font-medium">
                          <span className="text-blue-700">
                            {item.score} / {item.total || "?"}
                          </span>
                          <div className="mt-1 text-xs text-gray-500">
                            {item.testType === "company" && item.company
                              ? `${item.company} test`
                              : "Initial test"}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
                            : "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-white p-6 shadow-md">
                <h2 className="text-xl font-semibold text-gray-800">
                  Current Rewards
                </h2>
                <div className="mt-4 space-y-3">
                  <div className="rounded-lg bg-blue-50 px-4 py-3">
                    <div className="text-sm text-blue-700">Latest Points Earned</div>
                    <div className="text-2xl font-bold text-blue-800">
                      +{latestReport.pointsEarned || 0}
                    </div>
                  </div>
                  <div className="rounded-lg bg-green-50 px-4 py-3">
                    <div className="text-sm text-green-700">Unlocked Badges</div>
                    <div className="text-2xl font-bold text-green-800">
                      {latestBadges.length}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-xl bg-white p-6 shadow-md">
              <h2 className="text-xl font-semibold text-gray-800">
                Latest Initial Report
              </h2>
              {!results[0]?.report ? (
                <p className="mt-4 text-gray-500">
                  Complete a quiz to see strengths, weaknesses, and improvement tips here.
                </p>
              ) : (
                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                  <DashboardReportSection
                    title="Strengths"
                    items={results[0].report.strengths}
                    emptyText="No strong areas identified yet."
                    tone="green"
                  />
                  <DashboardReportSection
                    title="Weaknesses"
                    items={results[0].report.weaknesses}
                    emptyText="No weak areas identified yet."
                    tone="orange"
                  />
                  <DashboardReportSection
                    title="Tips"
                    items={results[0].report.tips}
                    emptyText="Tips will appear after your next attempt."
                    tone="blue"
                  />
                </div>
              )}
            </div>

            <div className="mt-8 rounded-xl bg-white p-6 shadow-md">
              <h2 className="text-xl font-semibold text-gray-800">
                Suggested Companies
              </h2>
              {!results[0]?.report?.companySuggestions?.length ? (
                <p className="mt-4 text-gray-500">
                  Finish a quiz to get company suggestions based on your current strengths.
                </p>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  {results[0].report.companySuggestions.map((company) => (
                    <div
                      key={company.name}
                      className="rounded-xl border border-blue-100 bg-blue-50 p-4"
                    >
                      <h3 className="text-base font-semibold text-gray-800">
                        {company.name}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">
                        {company.matchReason}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {company.focusAreas.map((area) => (
                          <span
                            key={`${company.name}-${area}`}
                            className="rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700"
                          >
                            Focus: {area}
                          </span>
                        ))}
                      </div>
                      <Link
                        to={`/quiz?company=${encodeURIComponent(company.name)}`}
                        className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                      >
                        Take {company.name} Test
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="rounded-xl bg-white p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">Skill Tracker</h2>
                  <Link
                    to="/quiz"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Practice More
                  </Link>
                </div>
                {skillTracker.trackedSkills.length === 0 ? (
                  <p className="mt-4 text-gray-500">
                    Complete more quizzes to unlock skill trends and recommended focus areas.
                  </p>
                ) : (
                  <div className="mt-5 space-y-4">
                    {skillTracker.trackedSkills.slice(0, 5).map((skill) => (
                      <div key={skill.label}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700">{skill.label}</span>
                          <span className="text-gray-500">
                            Latest {skill.latest}% • Demand {skill.demand}%
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-gray-100">
                          <div
                            className="h-2 rounded-full bg-blue-600"
                            style={{ width: `${skill.latest}%` }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          Trend {skill.trend >= 0 ? "+" : ""}
                          {skill.trend}% over recent attempts
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
                    Recommended Focus
                  </h3>
                  <div className="mt-3 space-y-2">
                    {skillTracker.recommendedFocus.length ? (
                      skillTracker.recommendedFocus.map((item) => (
                        <div
                          key={item.label}
                          className="rounded-lg border border-orange-100 bg-orange-50 px-4 py-3"
                        >
                          <div className="font-medium text-orange-800">{item.label}</div>
                          <div className="mt-1 text-sm text-orange-700">{item.reason}</div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        Your stronger skills are in a good place. Keep building consistency.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-xl bg-white p-6 shadow-md">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">AI Mock Interview</h2>
                  <Link
                    to="/mock-interview"
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                  >
                    Start Interview
                  </Link>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  Practice company-specific interview questions and get instant feedback on your answers.
                </p>
                <div className="mt-5 space-y-3">
                  {interviewHistory.length ? (
                    interviewHistory.slice(0, 4).map((session) => (
                      <div
                        key={session._id}
                        className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                      >
                        <div className="font-medium text-gray-800">
                          {session.company || "General"} • {session.role || "Interview"}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Skill: {session.skill || "General"} • Score: {session.overallScore}%
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                      No mock interviews yet. Start one to build speaking confidence and interview readiness.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, color = "blue", isText = false }) {
  const colors = {
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    amber: "text-amber-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
        {title}
      </h3>
      <p
        className={`mt-3 text-3xl sm:text-4xl font-bold ${colors[color]} ${
          isText ? "text-2xl sm:text-3xl" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function DashboardReportSection({ title, items = [], emptyText, tone }) {
  const toneClasses = {
    green: "border-green-200 bg-green-50 text-green-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500">{emptyText}</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={`${title}-${item}`}
              className={`rounded-full border px-3 py-1 text-sm font-medium ${toneClasses[tone]}`}
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
