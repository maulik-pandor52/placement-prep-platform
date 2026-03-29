import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import StudentLayout from "../components/StudentLayout";

export default function StudentResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [results, setResults] = useState([]);

  const latestSavedResult = results[0] || null;
  const locationState = location.state || {};
  const activeResult =
    locationState.total > 0
      ? locationState
      : latestSavedResult || { score: 0, total: 0, report: {}, testType: "initial", company: "" };

  const {
    score = 0,
    total = 0,
    report = {},
    testType = "initial",
    company = "",
  } = activeResult;
  const {
    readinessScore = 0,
    readinessLevel = "Needs Work",
    benchmarkScore = 0,
    benchmarkGap = 0,
    readinessSummary = "",
    improvementRoadmap = [],
    categoryInsights = [],
    skillGapAnalysis = [],
    weakAreaDetails = [],
    performanceBand = "Developing",
    performanceSummary = "",
  } = report;

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const previousResult =
    latestSavedResult && latestSavedResult._id === activeResult._id
      ? results[1] || null
      : results[0] || null;
  const previousPercentage =
    previousResult?.total > 0
      ? Math.round((previousResult.score / previousResult.total) * 100)
      : null;
  const changeFromPrevious =
    previousPercentage === null ? null : percentage - previousPercentage;

  const status = useMemo(() => {
    if (percentage >= 90) return "Outstanding";
    if (percentage >= 75) return "Strong";
    if (percentage >= 50) return "Progressing";
    return "Keep Practicing";
  }, [percentage]);

  const performanceInsight = useMemo(() => {
    if (percentage >= 85) {
      return {
        level: "High Momentum",
        tone: "emerald",
        summary:
          "You are performing at a strong level. The focus now should be consistency and company-specific polish.",
        nextMove: testType === "company" ? "Refine weak areas and try a harder company round." : "Move into a company-specific test while your score is strong.",
      };
    }
    if (percentage >= 65) {
      return {
        level: "Building Well",
        tone: "teal",
        summary:
          "Your foundation is working, but a few weak spots are still holding back your readiness score.",
        nextMove: "Revise the top weak skill first, then retake a focused quiz within the next two attempts.",
      };
    }
    if (percentage >= 40) {
      return {
        level: "Needs Focus",
        tone: "amber",
        summary:
          "You are getting some answers right, but the overall performance shows gaps in both speed and concept clarity.",
        nextMove: "Do not jump to harder tests yet. Practice one weak skill and one weak category first.",
      };
    }

    return {
      level: "Recovery Zone",
      tone: "rose",
      summary:
        "This attempt shows that your basics need reinforcement before moving ahead to company-level pressure.",
      nextMove: "Return to foundational practice, revise concepts, and then retake a simpler quiz.",
    };
  }, [percentage, testType]);

  const nextActionCards = useMemo(() => {
    const actions = [];

    if (report.weaknesses?.[0]) {
      actions.push({
        title: `Fix ${report.weaknesses[0]} first`,
        text: `Your report shows ${report.weaknesses[0]} as a weak area. Spend your next practice session there before attempting a broader test again.`,
      });
    }

    if (skillGapAnalysis?.[0]) {
      actions.push({
        title: `Close the ${skillGapAnalysis[0].label} gap`,
        text: `You are at ${skillGapAnalysis[0].currentScore}% and the target is ${skillGapAnalysis[0].targetScore}%. This is your highest-priority improvement area.`,
      });
    }

    if (report.companySuggestions?.[0]) {
      actions.push({
        title: `Prepare for ${report.companySuggestions[0].name}`,
        text: report.companySuggestions[0].matchReason,
      });
    }

    if (!actions.length) {
      actions.push({
        title: "Build one stronger retake plan",
        text: "Review your weak areas, revise one category, and retake the quiz with a more focused plan.",
      });
    }

    return actions.slice(0, 3);
  }, [report.companySuggestions, report.weaknesses, skillGapAnalysis]);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    axios
      .get("http://localhost:5000/api/quiz/results", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setResults(res.data || []))
      .catch(() => {});
  }, [navigate, token]);

  return (
    <StudentLayout
      title="Your result is ready"
      subtitle="Review this attempt carefully before you choose your next practice step."
      actions={
        <>
          <button onClick={() => navigate("/quiz")} className="primary-btn">
            Retry Quiz
          </button>
          <button onClick={() => navigate("/dashboard")} className="secondary-btn">
            Dashboard
          </button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="section-panel">
          <div className="soft-badge">
            {testType === "company" && company ? `${company} test` : "Initial test"}
          </div>
          <div className="mt-6 flex flex-wrap items-end gap-4">
            <div className="text-6xl font-black text-slate-100">
              {score}
              <span className="text-3xl font-semibold text-slate-400"> / {total}</span>
            </div>
            <div className="student-chip px-4 py-2 text-lg">
              {percentage}%
            </div>
          </div>
          <h2 className="mt-5 text-3xl font-black text-slate-100">{status}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            {performanceInsight.summary}
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <InfoCard title="Points This Quiz" value={`+${report.pointsEarned || 0}`} />
            <InfoCard title="Total Points" value={String(report.totalPoints || 0)} />
          </div>
        </section>

        <section className="section-panel">
          <h2 className="panel-title">Badges and Tips</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {(report.badgesEarned?.length ? report.badgesEarned : ["No new badge this time"]).map((item) => (
              <span
                key={item}
                className="student-chip"
              >
                {item}
              </span>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            {(report.tips?.length ? report.tips : ["Review the report and try again."]).map((tip) => (
              <div key={tip} className="student-card text-sm text-slate-300">
                {tip}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <InfoCard title="Performance Level" value={performanceInsight.level} tone={performanceInsight.tone} />
        <InfoCard title="Performance Band" value={performanceBand} tone="blue" />
        <InfoCard title="Readiness Score" value={`${readinessScore}%`} />
        <InfoCard title="Readiness Level" value={readinessLevel} />
        <InfoCard
          title="Benchmark Gap"
          value={`${benchmarkGap >= 0 ? "+" : ""}${benchmarkGap}%`}
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="section-panel">
          <h2 className="panel-title">Progress Check</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <InfoCard title="Current Score" value={`${percentage}%`} />
            <InfoCard
              title="Previous Attempt"
              value={previousPercentage === null ? "No data" : `${previousPercentage}%`}
            />
            <InfoCard
              title="Change"
              value={
                changeFromPrevious === null
                  ? "New run"
                  : `${changeFromPrevious >= 0 ? "+" : ""}${changeFromPrevious}%`
              }
              tone={
                changeFromPrevious === null
                  ? "blue"
                  : changeFromPrevious >= 0
                    ? "green"
                    : "orange"
              }
            />
          </div>
          <div className="mt-5 student-card text-sm leading-7 text-slate-300">
            {changeFromPrevious === null
              ? "This looks like your first comparable saved attempt, so use it as your new baseline."
              : changeFromPrevious >= 0
                ? `You improved by ${changeFromPrevious}% from the previous attempt. Keep this momentum and target the next weak area.`
                : `Your score dropped by ${Math.abs(changeFromPrevious)}% compared with the previous attempt. Slow down, revise the weak area, and try again with more focus.`}
          </div>
        </section>

        <section className="section-panel">
          <h2 className="panel-title">Best Next Move</h2>
          <div className="mt-5 student-tint text-sm leading-7 text-slate-200">
            {performanceInsight.nextMove}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {nextActionCards.map((item) => (
              <ActionInsight key={item.title} title={item.title} text={item.text} />
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="section-panel">
          <h2 className="panel-title">Readiness Summary</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            {readinessSummary || "Keep practicing to unlock deeper readiness insights."}
          </p>
          <div className="mt-5 student-card text-sm leading-7 text-slate-300">
            {performanceSummary || "Performance-based summary will appear after more attempts."}
          </div>
          <div className="mt-6 student-card">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Target Benchmark
            </div>
            <div className="mt-3 text-4xl font-black text-slate-100">
              {benchmarkScore}%
            </div>
          </div>
        </section>

        <section className="section-panel">
          <h2 className="panel-title">Improvement Roadmap</h2>
          <div className="mt-5 space-y-3">
            {(improvementRoadmap.length ? improvementRoadmap : ["No roadmap yet."]).map((item) => (
              <div key={item} className="student-card text-sm leading-7 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <ChipPanel title="Strengths" items={report.strengths} tone="green" />
        <ChipPanel title="Weaknesses" items={report.weaknesses} tone="orange" />
        <section className="section-panel">
          <h2 className="panel-title">Company Suggestions</h2>
          <div className="mt-5 space-y-3">
            {(report.companySuggestions?.length ? report.companySuggestions : []).map((item) => (
              <div key={item.name} className="student-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-100">{item.name}</div>
                  <div className="student-chip">
                    {item.selectionChance || 0}% chance
                  </div>
                </div>
                <p className="mt-2 text-sm leading-7 text-slate-300">{item.matchReason}</p>
                <div className="mt-2 text-sm text-slate-400">
                  Demand: {item.demandScore || 0}% / {item.nextMilestone || "Keep improving core skills."}
                </div>
              </div>
            ))}
            {!report.companySuggestions?.length ? (
              <p className="text-sm text-slate-400">No company suggestions yet.</p>
            ) : null}
          </div>
        </section>
      </div>

      <section className="section-panel mt-6">
        <h2 className="panel-title">Weak Area Priority</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(weakAreaDetails.length ? weakAreaDetails : []).map((item) => (
            <WeakAreaCard key={`${item.type}-${item.label}`} item={item} />
          ))}
          {!weakAreaDetails.length ? (
            <p className="text-sm text-slate-400">Weak areas will appear after more detailed performance data is available.</p>
          ) : null}
        </div>
      </section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="section-panel">
          <h2 className="panel-title">Skill Performance</h2>
          <div className="mt-5 space-y-4">
            {(report.skillBreakdown?.length ? report.skillBreakdown : []).map((item) => (
              <BarInsight
                key={item.label}
                label={item.label}
                value={item.percentage}
                meta={`${item.correct}/${item.total} correct`}
                tone={item.percentage >= 70 ? "green" : item.percentage >= 50 ? "blue" : "orange"}
              />
            ))}
            {!report.skillBreakdown?.length ? (
              <p className="text-sm text-slate-400">No skill performance data yet.</p>
            ) : null}
          </div>
        </section>

        <section className="section-panel">
          <h2 className="panel-title">Category Performance</h2>
          <div className="mt-5 space-y-4">
            {(report.categoryBreakdown?.length ? report.categoryBreakdown : []).map((item) => (
              <BarInsight
                key={item.label}
                label={item.label}
                value={item.percentage}
                meta={`${item.correct}/${item.total} correct`}
                tone={item.percentage >= 70 ? "green" : item.percentage >= 50 ? "blue" : "orange"}
              />
            ))}
            {!report.categoryBreakdown?.length ? (
              <p className="text-sm text-slate-400">No category performance data yet.</p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="section-panel">
          <h2 className="panel-title">Skill Gap Analysis</h2>
          <div className="mt-5 space-y-4">
            {skillGapAnalysis.length ? (
              skillGapAnalysis.map((item) => (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-800">{item.label}</span>
                    <span className="text-slate-500">
                      {item.currentScore}% now / {item.targetScore}% target
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
              <p className="text-sm text-slate-400">No skill-gap data yet.</p>
            )}
          </div>
        </section>

        <section className="section-panel">
          <h2 className="panel-title">Category Insights</h2>
          <div className="mt-5 space-y-3">
            {(categoryInsights.length ? categoryInsights : ["No category insights yet."]).map((item) => (
              <div key={item} className="student-card text-sm leading-7 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="section-panel mt-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="panel-title">All Results</h2>
          <Link to="/dashboard" className="secondary-btn">
            Back to Dashboard
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.length ? (
            results.map((item) => (
              <div
                key={item._id}
                className="student-card"
              >
                <div className="text-2xl font-black text-slate-100">
                  {item.score}/{item.total}
                </div>
                <div className="mt-2 text-sm text-slate-400">
                  {item.testType === "company" && item.company
                    ? `${item.company} test`
                    : "Initial test"}
                </div>
                <div className="mt-4 text-sm text-slate-400">
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
            ))
          ) : (
            <p className="text-sm text-slate-400">No saved attempts yet.</p>
          )}
        </div>
      </section>
    </StudentLayout>
  );
}

function InfoCard({ title, value, tone = "teal" }) {
  const tones = {
    teal: "border-cyan-300/20 bg-cyan-400/10 text-cyan-300",
    green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    orange: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    blue: "border-violet-400/20 bg-violet-400/10 text-violet-200",
    rose: "border-rose-400/20 bg-rose-400/10 text-rose-200",
    amber: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  };

  return (
    <div className={`rounded-[24px] border px-5 py-4 ${tones[tone]}`}>
      <div className="text-sm">{title}</div>
      <div className="mt-2 text-3xl font-black text-slate-100">{value}</div>
    </div>
  );
}

function ChipPanel({ title, items = [], tone }) {
  const tones = {
    green: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
    orange: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    blue: "border-cyan-300/20 bg-cyan-400/10 text-cyan-300",
  };

  return (
    <section className="section-panel">
      <h2 className="panel-title">{title}</h2>
      <div className="mt-5 flex flex-wrap gap-2">
        {(items?.length ? items : ["No items yet"]).map((item) => (
          <span
            key={`${title}-${item}`}
            className={`max-w-full break-words rounded-full border px-3 py-1 text-sm font-semibold ${tones[tone]}`}
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function ActionInsight({ title, text }) {
  return (
    <div className="student-card">
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </div>
      <p className="mt-3 text-sm leading-7 text-slate-300">{text}</p>
    </div>
  );
}

function BarInsight({ label, value, meta, tone }) {
  const tones = {
    green: "bg-emerald-600",
    blue: "bg-sky-600",
    orange: "bg-orange-500",
  };

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold text-slate-200">{label}</span>
        <span className="text-slate-400">{value}%</span>
      </div>
      <div className="student-progress">
        <div
          className={`h-3 rounded-full ${tones[tone]}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <div className="mt-2 text-sm text-slate-400">{meta}</div>
    </div>
  );
}

function WeakAreaCard({ item }) {
  const severityTones = {
    critical: "border-rose-400/20 bg-rose-400/10 text-rose-200",
    high: "border-orange-400/20 bg-orange-400/10 text-orange-200",
    moderate: "border-amber-400/20 bg-amber-400/10 text-amber-200",
    low: "border-cyan-300/20 bg-cyan-400/10 text-cyan-200",
  };

  return (
    <div className="student-card">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold text-slate-100">{item.label}</div>
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${severityTones[item.severity] || severityTones.moderate}`}>
          {item.severity}
        </span>
      </div>
      <div className="mt-3 text-sm text-slate-400">{item.type} / {item.percentage}%</div>
      <p className="mt-3 text-sm leading-7 text-slate-300">{item.reason}</p>
      <div className="mt-3 rounded-[18px] border border-slate-700/50 px-4 py-3 text-sm leading-7 text-slate-200">
        {item.nextStep}
      </div>
    </div>
  );
}
