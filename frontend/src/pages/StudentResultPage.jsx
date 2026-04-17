import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import {
  CompanySuggestionList,
  DashboardSection,
  SummaryPanel,
} from "../components/dashboard/InsightModules";
import {
  BreakdownDoughnutChart,
  ScoreTrendChart,
} from "../components/dashboard/PerformanceCharts";
import {
  SkeletonMetricGrid,
  SkeletonPanel,
} from "../components/dashboard/DashboardSkeletons";
import { quizService } from "../services/quizService";

export default function StudentResultPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

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

  const topHighlights = useMemo(() => {
    const strengths = (report.strengths || []).slice(0, 3).map((item) => ({
      label: item,
      type: "strength",
    }));

    const weakAreas = (weakAreaDetails.length
      ? weakAreaDetails.slice(0, 3).map((item) => ({
          label: item.label,
          type: "weakness",
          meta: `${item.percentage}% / ${item.severity}`,
        }))
      : (report.weaknesses || []).slice(0, 3).map((item) => ({
          label: item,
          type: "weakness",
        })));

    return { strengths, weakAreas };
  }, [report.strengths, report.weaknesses, weakAreaDetails]);

  const subjectOptions = useMemo(() => {
    const values = new Set();

    results.forEach((item) => {
      item.report?.skillBreakdown?.forEach((skill) => values.add(skill.label));
      item.report?.categoryBreakdown?.forEach((category) => values.add(category.label));
    });

    return ["all", ...Array.from(values)];
  }, [results]);

  const filteredResults = useMemo(() => {
    const now = new Date();

    return results.filter((item) => {
      const createdAt = item.createdAt ? new Date(item.createdAt) : null;
      const matchesDate =
        dateFilter === "all" ||
        !createdAt ||
        (dateFilter === "7d" && now - createdAt <= 7 * 24 * 60 * 60 * 1000) ||
        (dateFilter === "30d" && now - createdAt <= 30 * 24 * 60 * 60 * 1000);

      const reportData = item.report || {};
      const matchesSubject =
        subjectFilter === "all" ||
        reportData.skillBreakdown?.some((entry) => entry.label === subjectFilter) ||
        reportData.categoryBreakdown?.some((entry) => entry.label === subjectFilter);

      return matchesDate && matchesSubject;
    });
  }, [dateFilter, results, subjectFilter]);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    quizService
      .getResults()
      .then((res) => setResults(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [navigate, token]);

  return (
    <StudentLayout
      title="Your result is ready"
      subtitle="Review this attempt carefully before you choose your next practice step."
      actions={
        <>
          <button onClick={() => window.print()} className="secondary-btn">
            Export PDF
          </button>
          <button onClick={() => navigate("/quiz")} className="primary-btn">
            Retry Quiz
          </button>
          <button onClick={() => navigate("/dashboard")} className="secondary-btn">
            Dashboard
          </button>
        </>
      }
    >
      {loading ? (
        <>
          <SkeletonMetricGrid count={5} />
          <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <SkeletonPanel lines={3} />
            <SkeletonPanel lines={4} />
          </div>
        </>
      ) : null}

      {!loading ? (
        <>
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="section-panel">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="panel-title">Score trend</h2>
              <p className="mt-2 text-sm leading-7 text-slate-400">
                See how your recent attempts are moving over time.
              </p>
            </div>
            <div className="filter-cluster">
              <select
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value)}
                className="field-input field-select"
              >
                <option value="all">All time</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
              <select
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
                className="field-input field-select"
              >
                {subjectOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === "all" ? "All subjects" : option}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {filteredResults.length ? (
            <div className="mt-5">
              <ScoreTrendChart results={filteredResults} />
            </div>
          ) : (
            <div className="empty-state mt-5">
              No results match the current filter. Try a wider date range or switch back to all subjects.
            </div>
          )}
        </section>

        <section className="section-panel">
          <h2 className="panel-title">Automatic highlights</h2>
          <p className="mt-2 text-sm leading-7 text-slate-400">
            Your strongest areas and the weak points that need the fastest attention.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <HighlightListCard
              title="Top strengths"
              tone="success"
              items={topHighlights.strengths}
              emptyText="Strengths will appear after a stronger quiz pattern is established."
            />
            <HighlightListCard
              title="Top weak areas"
              tone="warning"
              items={topHighlights.weakAreas}
              emptyText="Weak areas will appear once the report detects a consistent gap."
            />
          </div>
        </section>
      </div>

      <div className="dashboard-split mt-6">
        <div className="dashboard-stack">
          <DashboardSection
            title="Latest report summary"
            subtitle="Review strengths, weaknesses, and targeted practice tips in a cleaner modular layout."
          >
            <div className="summary-grid">
              <SummaryPanel title="Strengths" items={report.strengths} tone="success" />
              <SummaryPanel title="Weaknesses" items={report.weaknesses} tone="warning" />
              <SummaryPanel title="Tips" items={report.tips} tone="info" />
            </div>
          </DashboardSection>

          <DashboardSection
            title="Company suggestions"
            subtitle="Use the company-fit cards below to decide which targeted test to take next."
            className="mt-6"
          >
            <CompanySuggestionList
              companies={report.companySuggestions || []}
              emptyText="No company suggestions yet."
              actionLabel="Take {company} Test"
              layout="rows"
              scroll
            />
          </DashboardSection>
        </div>

        <aside className="dashboard-sidebar">
          <DashboardSection
            title="Weak area priority"
            subtitle="These are the most urgent gaps affecting your readiness."
            scroll
          >
            <div className="panel-stack">
              {weakAreaDetails.length ? (
                weakAreaDetails.map((item) => (
                  <WeakAreaCard key={`${item.type}-${item.label}`} item={item} />
                ))
              ) : (
                <div className="empty-state">
                  Weak areas will appear after more detailed performance data is available.
                </div>
              )}
            </div>
          </DashboardSection>
        </aside>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <BreakdownDoughnutChart
          title="Skill mix"
          items={report.skillBreakdown || []}
        />
        <BreakdownDoughnutChart
          title="Category mix"
          items={report.categoryBreakdown || []}
        />
      </div>

      <div className="performance-grid mt-6">
        <section className="performance-card">
          <h2 className="panel-title">Skill Performance</h2>
          <div className="mt-5 panel-scroll space-y-4">
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

        <section className="performance-card">
          <h2 className="panel-title">Category Performance</h2>
          <div className="mt-5 panel-scroll space-y-4">
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
          <div className="mt-5 panel-scroll space-y-4 pr-2">
            {skillGapAnalysis.length ? (
              skillGapAnalysis.map((item) => (
                <div key={item.label} className="progress-row">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-semibold text-slate-200">{item.label}</span>
                    <span className="text-slate-400">
                      {item.currentScore}% now / {item.targetScore}% target
                    </span>
                  </div>
                  <div className="student-progress">
                    <div
                      className="h-3 rounded-full bg-cyan-400"
                      style={{ width: `${Math.min(item.currentScore, 100)}%` }}
                    />
                  </div>
                  <div className="mt-3 text-sm text-slate-400">
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
          <div className="mt-5 panel-scroll space-y-3 pr-2">
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
        <div className="panel-scroll mt-5 pr-2">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredResults.length ? (
            filteredResults.map((item) => (
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
            <p className="text-sm text-slate-400">No saved attempts match this filter yet.</p>
          )}
          </div>
        </div>
      </section>
        </>
      ) : null}
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
    <div className="progress-row">
      <div className="mb-3 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-200">{label}</span>
        <span className="text-slate-400">{value}%</span>
      </div>
      <div className="student-progress">
        <div
          className={`h-3 rounded-full ${tones[tone]}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <div className="mt-3 text-sm text-slate-400">{meta}</div>
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
        <div>
          <div className="text-lg font-semibold text-slate-100">{item.label}</div>
          <div className="mt-1 text-sm text-slate-400">
            {item.type} area
          </div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${severityTones[item.severity] || severityTones.moderate}`}>
          {item.severity}
        </span>
      </div>
      <div className="mt-4 rounded-[16px] border border-slate-700/50 px-4 py-3">
        <div className="text-xs uppercase tracking-[0.16em] text-slate-500">Current accuracy</div>
        <div className="mt-2 text-2xl font-black text-slate-100">{item.percentage}%</div>
      </div>
      <p className="mt-4 text-sm leading-7 text-slate-300">{item.reason}</p>
      <div className="mt-4 rounded-[18px] border border-slate-700/50 px-4 py-3 text-sm leading-7 text-slate-200">
        {item.nextStep}
      </div>
    </div>
  );
}

function HighlightListCard({ title, items, emptyText, tone = "success" }) {
  const toneClass =
    tone === "warning"
      ? "border-amber-400/20 bg-amber-400/10"
      : "border-emerald-400/20 bg-emerald-400/10";

  return (
    <div className={`rounded-[24px] border p-5 ${toneClass}`}>
      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-100">{title}</div>
      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div key={`${title}-${item.label}`} className="rounded-[18px] border border-slate-700/40 bg-slate-950/25 px-4 py-3">
              <div className="font-semibold text-slate-100">{item.label}</div>
              {item.meta ? <div className="mt-1 text-sm text-slate-300">{item.meta}</div> : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="summary-empty mt-4">{emptyText}</div>
      )}
    </div>
  );
}
