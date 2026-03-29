import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import StudentLayout from "../components/StudentLayout";

const interviewDefaults = {
  company: "Infosys",
  role: "Frontend Developer",
  skill: "React",
};

export default function StudentMockInterviewPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [form, setForm] = useState(interviewDefaults);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    axios
      .get("http://localhost:5000/api/interview/history", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setHistory(res.data || []))
      .catch(() => setError("Could not load interview history."))
      .finally(() => setLoading(false));
  }, [navigate, token]);

  const generateQuestions = async () => {
    try {
      setGenerating(true);
      setError("");
      setReport(null);
      const res = await axios.get("http://localhost:5000/api/interview/questions", {
        headers: { Authorization: `Bearer ${token}` },
        params: form,
      });

      const nextQuestions = res.data?.questions || [];
      setQuestions(nextQuestions);
      setAnswers(nextQuestions.map(() => ({ answer: "" })));
    } catch {
      setError("Could not generate interview questions.");
    } finally {
      setGenerating(false);
    }
  };

  const submitInterview = async () => {
    try {
      setSubmitting(true);
      setError("");
      const res = await axios.post(
        "http://localhost:5000/api/interview/sessions",
        { ...form, answers },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setReport(res.data);
      setHistory((prev) => [res.data, ...prev]);
    } catch {
      setError("Could not save interview feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  const completion = useMemo(() => {
    if (!answers.length) return 0;
    const completed = answers.filter((item) => item.answer.trim()).length;
    return Math.round((completed / answers.length) * 100);
  }, [answers]);

  return (
    <StudentLayout
      title="Mock interview practice with a cleaner, calmer flow."
      subtitle="Generate focused interview questions, answer them at your own pace, and review structured feedback."
      actions={
        <button onClick={generateQuestions} className="primary-btn">
          {generating ? "Generating..." : "Generate Questions"}
        </button>
      }
    >
      {error ? (
        <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <section className="section-panel">
          <h2 className="text-2xl font-black text-slate-900">Interview Setup</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <Field label="Company" value={form.company} onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))} />
            <Field label="Role" value={form.role} onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))} />
            <Field label="Focus Skill" value={form.skill} onChange={(e) => setForm((prev) => ({ ...prev, skill: e.target.value }))} />
          </div>

          {questions.length ? (
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-xl font-black text-slate-900">Interview Round</h3>
                <span className="soft-badge">{completion}% complete</span>
              </div>
              <div className="space-y-5">
                {questions.map((item, index) => (
                  <div
                    key={item.id}
                    className="rounded-[24px] border border-slate-100 bg-white/80 p-5"
                  >
                    <div className="text-sm uppercase tracking-[0.2em] text-teal-700">
                      {item.topic}
                    </div>
                    <p className="mt-3 text-lg font-semibold text-slate-900">
                      {item.question}
                    </p>
                    <textarea
                      rows={4}
                      className="field-input mt-4"
                      placeholder="Type your interview answer here..."
                      value={answers[index]?.answer || ""}
                      onChange={(e) =>
                        setAnswers((prev) =>
                          prev.map((answer, answerIndex) =>
                            answerIndex === index
                              ? { ...answer, answer: e.target.value }
                              : answer,
                          ),
                        )
                      }
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={submitInterview}
                disabled={submitting || completion === 0}
                className={`primary-btn mt-6 ${submitting || completion === 0 ? "cursor-not-allowed opacity-60" : ""}`}
              >
                {submitting ? "Evaluating..." : "Get Interview Feedback"}
              </button>
            </div>
          ) : loading ? (
            <div className="mt-6 text-sm text-slate-500">Loading interview workspace...</div>
          ) : null}
        </section>

        <div className="space-y-6">
          <section className="section-panel">
            <h2 className="text-2xl font-black text-slate-900">Latest Feedback</h2>
            {!report ? (
              <p className="mt-4 text-sm text-slate-500">
                Complete an interview round to see your score, strengths, and improvement tips.
              </p>
            ) : (
              <>
                <div className="mt-5 rounded-[24px] border border-teal-100 bg-teal-50/70 px-5 py-5">
                  <div className="text-sm text-teal-700">Overall Score</div>
                  <div className="mt-2 text-5xl font-black text-slate-900">
                    {report.overallScore}%
                  </div>
                </div>
                <FeedbackList title="Strengths" items={report.strengths} tone="green" />
                <FeedbackList title="Improve Next" items={report.improvements} tone="orange" />
                <FeedbackList title="Tips" items={report.tips} tone="blue" />
              </>
            )}
          </section>

          <section className="section-panel">
            <h2 className="text-2xl font-black text-slate-900">Interview History</h2>
            <div className="mt-5 space-y-3">
              {history.length ? (
                history.slice(0, 5).map((item) => (
                  <div
                    key={item._id}
                    className="rounded-[22px] border border-slate-100 bg-white/80 px-4 py-3"
                  >
                    <div className="font-semibold text-slate-900">
                      {item.company || "General"} • {item.role || "Interview"}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      Skill: {item.skill || "General"} • Score: {item.overallScore}%
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">No interview sessions yet.</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </StudentLayout>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">{label}</label>
      <input {...props} className="field-input" />
    </div>
  );
}

function FeedbackList({ title, items = [], tone }) {
  const tones = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    blue: "border-sky-200 bg-sky-50 text-sky-700",
  };

  return (
    <div className="mt-5">
      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
        {title}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(items.length ? items : ["No items yet"]).map((item) => (
          <span
            key={`${title}-${item}`}
            className={`rounded-full border px-3 py-1 text-sm font-medium ${tones[tone]}`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
