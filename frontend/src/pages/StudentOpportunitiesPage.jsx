import { Link, useNavigate } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import useStudentPerformance from "../components/useStudentPerformance";

export default function StudentOpportunitiesPage() {
  const navigate = useNavigate();
  const { latestReport, skillTracker, interviewHistory, loading } = useStudentPerformance({
    navigate,
  });

  return (
    <StudentLayout
      title="Company opportunities"
      subtitle="Use company-fit signals, market demand, and recent interview practice to choose the smartest next preparation path."
      actions={
        <>
          <Link to="/quiz" className="primary-btn">
            Start New Quiz
          </Link>
          <Link to="/mock-interview" className="secondary-btn">
            Mock Interview
          </Link>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="section-panel">
          <h2 className="panel-title">Suggested companies</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {(latestReport.companySuggestions?.length
              ? latestReport.companySuggestions
              : []).map((company) => (
              <div key={company.name} className="student-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-lg font-semibold text-slate-100">{company.name}</div>
                  <div className="student-chip">{company.selectionChance || 0}% chance</div>
                </div>
                <p className="mt-3 text-sm leading-7 text-slate-400">{company.matchReason}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <StatCard label="Demand Score" value={`${company.demandScore || 0}%`} />
                  <StatCard
                    label="Next Milestone"
                    value={company.nextMilestone || "Keep improving"}
                    compact
                  />
                </div>
                <Link
                  to={`/quiz?company=${encodeURIComponent(company.name)}`}
                  className="primary-btn mt-4"
                >
                  Take {company.name} Test
                </Link>
              </div>
            ))}
            {!latestReport.companySuggestions?.length ? (
              <div className="empty-state md:col-span-2">
                Finish a scored quiz to unlock company suggestions.
              </div>
            ) : null}
          </div>
        </section>

        <section className="section-panel">
          <h2 className="panel-title">Market demand</h2>
          <div className="mt-5 space-y-4">
            {(skillTracker.industryTrends || []).slice(0, 4).map((trend) => (
              <div key={trend.company} className="student-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-slate-100">{trend.company}</div>
                    <div className="mt-1 text-sm text-slate-400">{trend.industry}</div>
                  </div>
                  <div className="student-chip">{trend.growthLabel}</div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <StatCard label="Top Skill" value={trend.topSkill || "General"} compact />
                  <StatCard label="Demand Score" value={`${trend.demandScore || 0}%`} />
                </div>
                <div className="mt-4 text-sm leading-7 text-slate-400">
                  Benchmark {trend.benchmarkScore || 0}% /{" "}
                  {trend.liveOpenings ? `Live openings ${trend.liveOpenings}` : "Live openings unavailable"} /{" "}
                  {trend.averageSalary ? `Avg salary ${trend.averageSalary}` : "Salary unavailable"}
                </div>
              </div>
            ))}
            {!skillTracker.industryTrends?.length ? (
              <div className="empty-state">Industry-trend data will appear here.</div>
            ) : null}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="section-panel">
          <h2 className="panel-title">Interview readiness</h2>
          <div className="mt-5 space-y-3">
            {interviewHistory.slice(0, 4).map((item) => (
              <div key={item._id} className="student-card">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-slate-100">
                    {item.company || "General"} / {item.role || "Interview"}
                  </div>
                  <div className="student-chip">{item.overallScore || 0}%</div>
                </div>
                <div className="mt-3 text-sm text-slate-400">
                  Confidence {item.confidenceScore || 0}% / Delivery {item.deliveryScore || 0}%
                </div>
              </div>
            ))}
            {!interviewHistory.length ? (
              <div className="empty-state">Practice a mock interview to see readiness here.</div>
            ) : null}
          </div>
        </section>

        <section className="section-panel">
          <h2 className="panel-title">Opportunity roadmap</h2>
          <div className="mt-5 space-y-3">
            {(latestReport.improvementRoadmap?.length
              ? latestReport.improvementRoadmap
              : ["Your opportunity roadmap will appear after a completed quiz."]).map((item) => (
              <div key={item} className="student-card text-sm leading-7 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>

      {loading ? <div className="mt-6 empty-state">Refreshing company and market data...</div> : null}
    </StudentLayout>
  );
}

function StatCard({ label, value, compact = false }) {
  return (
    <div className="student-tint">
      <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">{label}</div>
      <div className={`mt-3 font-black text-slate-100 ${compact ? "text-xl" : "text-3xl"}`}>
        {value}
      </div>
    </div>
  );
}
