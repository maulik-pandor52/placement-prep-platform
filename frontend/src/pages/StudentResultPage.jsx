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

  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  const status = useMemo(() => {
    if (percentage >= 90) return "Outstanding";
    if (percentage >= 75) return "Strong";
    if (percentage >= 50) return "Progressing";
    return "Keep Practicing";
  }, [percentage]);

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
            <div className="text-6xl font-black text-slate-900">
              {score}
              <span className="text-3xl font-semibold text-slate-400"> / {total}</span>
            </div>
            <div className="rounded-full bg-teal-50 px-4 py-2 text-lg font-semibold text-teal-700">
              {percentage}%
            </div>
          </div>
          <h2 className="mt-5 text-3xl font-black text-slate-900">{status}</h2>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <InfoCard title="Points This Quiz" value={`+${report.pointsEarned || 0}`} />
            <InfoCard title="Total Points" value={String(report.totalPoints || 0)} />
          </div>
        </section>

        <section className="section-panel">
          <h2 className="text-2xl font-black text-slate-900">Badges and Tips</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {(report.badgesEarned?.length ? report.badgesEarned : ["No new badge this time"]).map((item) => (
              <span
                key={item}
                className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800"
              >
                {item}
              </span>
            ))}
          </div>
          <div className="mt-6 space-y-3">
            {(report.tips?.length ? report.tips : ["Review the report and try again."]).map((tip) => (
              <div key={tip} className="rounded-[22px] border border-sky-100 bg-sky-50/70 px-4 py-3 text-sm text-slate-700">
                {tip}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <ChipPanel title="Strengths" items={report.strengths} tone="green" />
        <ChipPanel title="Weaknesses" items={report.weaknesses} tone="orange" />
        <ChipPanel title="Company Suggestions" items={report.companySuggestions?.map((item) => item.name)} tone="blue" />
      </div>

      <section className="section-panel mt-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-slate-900">All Results</h2>
          <Link to="/dashboard" className="secondary-btn">
            Back to Dashboard
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {results.length ? (
            results.map((item) => (
              <div
                key={item._id}
                className="rounded-[24px] border border-slate-100 bg-white/80 p-5"
              >
                <div className="text-2xl font-black text-slate-900">
                  {item.score}/{item.total}
                </div>
                <div className="mt-2 text-sm text-slate-500">
                  {item.testType === "company" && item.company
                    ? `${item.company} test`
                    : "Initial test"}
                </div>
                <div className="mt-4 text-sm text-slate-500">
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
            <p className="text-sm text-slate-500">No saved attempts yet.</p>
          )}
        </div>
      </section>
    </StudentLayout>
  );
}

function InfoCard({ title, value }) {
  return (
    <div className="rounded-[24px] border border-teal-100 bg-teal-50/70 px-5 py-4">
      <div className="text-sm text-teal-700">{title}</div>
      <div className="mt-2 text-3xl font-black text-slate-900">{value}</div>
    </div>
  );
}

function ChipPanel({ title, items = [], tone }) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    blue: "border-sky-200 bg-sky-50 text-sky-700",
  };

  return (
    <section className="section-panel">
      <h2 className="text-2xl font-black text-slate-900">{title}</h2>
      <div className="mt-5 flex flex-wrap gap-2">
        {(items?.length ? items : ["No items yet"]).map((item) => (
          <span
            key={`${title}-${item}`}
            className={`rounded-full border px-3 py-1 text-sm font-semibold ${tones[tone]}`}
          >
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}
