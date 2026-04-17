import { Link, useNavigate } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";
import useStudentPerformance from "../components/useStudentPerformance";
import {
  CompanySuggestionList,
  DashboardSection,
  ScrollableList,
} from "../components/dashboard/InsightModules";

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
      <div className="dashboard-split">
        <div className="dashboard-stack">
          <DashboardSection
            title="Suggested companies"
            subtitle="Choose targeted tests from a cleaner recommendation grid built for larger company datasets."
            kicker="Recommendations"
            className="overflow-hidden"
          >
            <CompanySuggestionList
              companies={latestReport.companySuggestions || []}
              emptyText="Finish a scored quiz to unlock company suggestions."
              actionLabel="Take {company} Test"
              layout="rows"
              scroll
            />
          </DashboardSection>

          <DashboardSection
            title="Interview readiness"
            subtitle="Keep recent interview sessions visible while preventing the page from stretching endlessly."
            className="mt-6"
            scroll
          >
            <div className="panel-stack">
              {interviewHistory.length ? (
                interviewHistory.slice(0, 8).map((item) => (
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
                ))
              ) : (
                <div className="empty-state">Practice a mock interview to see readiness here.</div>
              )}
            </div>
          </DashboardSection>
        </div>

        <aside className="dashboard-sidebar">
          <DashboardSection
            title="Market demand"
            subtitle="Industry trends stay in a scrollable side rail so long company data stays manageable."
            scroll
          >
            <ScrollableList
              items={(skillTracker.industryTrends || []).slice(0, 8)}
              emptyText="Industry-trend data will appear here."
              renderItem={(trend) => (
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
              )}
            />
          </DashboardSection>

          <DashboardSection
            title="Opportunity roadmap"
            subtitle="A focused action stack for what to do next."
            className="mt-6"
            scroll
          >
            <div className="panel-stack">
              {(latestReport.improvementRoadmap?.length
                ? latestReport.improvementRoadmap
                : ["Your opportunity roadmap will appear after a completed quiz."]).map((item) => (
                <div key={item} className="student-card text-sm leading-7 text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </DashboardSection>
        </aside>
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
