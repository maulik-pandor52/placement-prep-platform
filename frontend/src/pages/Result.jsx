// src/pages/Result.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const latestSavedResult = results[0] || null;
  const locationState = location.state || {};
  const activeResult =
    locationState.total > 0
      ? {
          score: locationState.score || 0,
          total: locationState.total || 0,
          report: locationState.report || {},
          testType: locationState.testType || "initial",
          company: locationState.company || "",
        }
      : latestSavedResult
        ? {
            score: latestSavedResult.score || 0,
            total: latestSavedResult.total || 0,
            report: latestSavedResult.report || {},
            testType: latestSavedResult.testType || "initial",
            company: latestSavedResult.company || "",
          }
        : {
            score: 0,
            total: 0,
            report: {},
            testType: "initial",
            company: "",
          };

  const {
    score = 0,
    total = 0,
    report = {},
    testType = "initial",
    company = "",
  } = activeResult;
  const {
    strengths = [],
    weaknesses = [],
    tips = [],
    skillBreakdown = [],
    categoryBreakdown = [],
    companySuggestions = [],
    pointsEarned = 0,
    totalPoints = 0,
    badgesEarned = [],
  } = report;

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const resultInfo = useMemo(() => {
    if (percentage >= 90)
      return { text: "Outstanding!", color: "text-green-600", emoji: "🌟" };
    if (percentage >= 80)
      return { text: "Excellent!", color: "text-green-600", emoji: "🚀" };
    if (percentage >= 65)
      return { text: "Well Done!", color: "text-blue-600", emoji: "👍" };
    if (percentage >= 50)
      return { text: "Good Effort", color: "text-indigo-600", emoji: "💪" };
    return { text: "Keep Practicing", color: "text-orange-600", emoji: "📚" };
  }, [percentage]);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchResults = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get("http://localhost:5000/api/quiz/results", {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 10000,
        });
        setResults(res.data || []);
      } catch (err) {
        console.error("Failed to load results:", err);
        setError(
          err.response?.data?.message || "Could not load your saved quiz results.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [navigate, token]);

  // Auto redirect after 4 seconds
  useEffect(() => {
    if (false && total > 0) {
      const timer = setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [navigate, total]);

  // Protection: if someone lands here without state → redirect
  useEffect(() => {
    if (false && total === 0) {
      const timer = setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [total, navigate]);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto w-full max-w-6xl">
        {loading ? (
          <div className="mb-6 rounded-xl bg-white p-6 text-gray-600 shadow-md">
            Loading your saved results...
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-red-700">
            {error}
          </div>
        ) : null}

        <div className="w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Quiz Completed!
        </h1>
        <p className="mb-6 text-sm font-medium uppercase tracking-wide text-gray-500">
          {testType === "company" && company
            ? `${company} Company Test`
            : "Initial Skill Test"}
        </p>

        <div className="mb-8">
          <div className="text-6xl font-extrabold text-gray-900 mb-2">
            {score}{" "}
            <span className="text-4xl font-semibold text-gray-500">
              / {total}
            </span>
          </div>
          <div className="text-3xl font-bold mb-4">{percentage}%</div>
          <p className={`text-2xl font-semibold ${resultInfo.color}`}>
            {resultInfo.emoji} {resultInfo.text}
          </p>
        </div>

        <p className="text-gray-600 mb-6">
          Your result will stay here until you choose where to go next.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate("/quiz", { replace: true })}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition"
          >
            Retry Quiz
          </button>

          <button
            onClick={() => navigate("/dashboard", { replace: true })}
            className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition"
          >
            Dashboard Now
          </button>
        </div>
        </div>

        {total > 0 && (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <ReportCard
              title="Strengths"
              accent="green"
              items={
                strengths.length
                  ? strengths
                  : ["Keep practicing to surface strong areas in your next report."]
              }
            />
            <ReportCard
              title="Weaknesses"
              accent="orange"
              items={
                weaknesses.length
                  ? weaknesses
                  : ["No major weak areas detected in this attempt."]
              }
            />
            <ReportCard
              title="Improvement Tips"
              accent="blue"
              items={tips.length ? tips : ["Review key topics and retake the quiz."]}
            />
            <GamificationCard
              pointsEarned={pointsEarned}
              totalPoints={totalPoints}
              badgesEarned={badgesEarned}
            />
            <BreakdownCard
              title="Skill Breakdown"
              accent="purple"
              items={skillBreakdown}
            />
            <BreakdownCard
              title="Category Breakdown"
              accent="indigo"
              items={categoryBreakdown}
            />
            <CompanySuggestionsCard items={companySuggestions} />
          </div>
        )}
        </div>

        <div className="mt-8 rounded-2xl bg-white p-8 shadow-xl">
          <h2 className="text-2xl font-semibold text-gray-800">All Results</h2>
          {!results.length ? (
            <p className="mt-4 text-gray-500">No saved quiz attempts yet.</p>
          ) : (
            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {results.map((item) => {
                const itemPercentage = item.total
                  ? Math.round((item.score / item.total) * 100)
                  : 0;

                return (
                  <div
                    key={item._id}
                    className="rounded-xl border border-gray-100 bg-gray-50 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-lg font-semibold text-gray-800">
                          {item.score}/{item.total}
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          {itemPercentage}% •{" "}
                          {item.testType === "company" && item.company
                            ? `${item.company} test`
                            : "Initial test"}
                        </div>
                      </div>
                      <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                        {item.report?.pointsEarned || 0} pts
                      </span>
                    </div>
                    <div className="mt-4 text-sm text-gray-500">
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
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GamificationCard({ pointsEarned, totalPoints, badgesEarned }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800">Rewards Earned</h2>
      <div className="mt-4 flex gap-6">
        <div>
          <div className="text-sm text-gray-500">Points This Quiz</div>
          <div className="text-3xl font-bold text-amber-700">+{pointsEarned}</div>
        </div>
        <div>
          <div className="text-sm text-gray-500">Total Points</div>
          <div className="text-3xl font-bold text-amber-700">{totalPoints}</div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {badgesEarned.length ? (
          badgesEarned.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-amber-300 bg-white px-3 py-1 text-sm font-medium text-amber-800"
            >
              Badge: {badge}
            </span>
          ))
        ) : (
          <span className="text-sm text-gray-500">
            No new badge this time. Keep going.
          </span>
        )}
      </div>
    </div>
  );
}

function ReportCard({ title, items, accent }) {
  const accents = {
    green: "border-green-200 bg-green-50 text-green-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={`${title}-${item}`}
            className={`rounded-full border px-3 py-1 text-sm font-medium ${accents[accent]}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function BreakdownCard({ title, items, accent }) {
  const accentClasses = {
    purple: "bg-purple-600",
    indigo: "bg-indigo-600",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-1">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          Breakdown data will appear after a completed quiz attempt.
        </p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={`${title}-${item.label}`}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-gray-700">{item.label}</span>
                <span className="text-gray-500">
                  {item.correct}/{item.total} ({item.percentage}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100">
                <div
                  className={`h-2 rounded-full ${accentClasses[accent]}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompanySuggestionsCard({ items }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
      <h2 className="text-lg font-semibold text-gray-800">Company Suggestions</h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">
          Company suggestions will appear after we have enough quiz data.
        </p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.name}
              className="rounded-xl border border-blue-100 bg-blue-50 p-4"
            >
              <h3 className="text-base font-semibold text-gray-800">{item.name}</h3>
              <p className="mt-2 text-sm text-gray-600">{item.matchReason}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {item.focusAreas.map((area) => (
                  <span
                    key={`${item.name}-${area}`}
                    className="rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700"
                  >
                    Focus: {area}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
