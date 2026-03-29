import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const interviewDefaults = {
  company: "Infosys",
  role: "Frontend Developer",
  skill: "React",
};

export default function MockInterview() {
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

    const loadHistory = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/interview/history", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHistory(res.data || []);
      } catch (err) {
        console.error("Failed to load interview history:", err);
        setError("Could not load interview history.");
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
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
    } catch (err) {
      console.error("Failed to generate interview questions:", err);
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
    } catch (err) {
      console.error("Failed to save interview session:", err);
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-lg font-medium text-gray-600">
          Loading mock interview...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-5 sm:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">AI Mock Interview</h1>
            <p className="mt-2 text-gray-600">
              Generate targeted interview questions, practice your answers, and get instant feedback.
            </p>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-2xl bg-white p-6 shadow-md">
            <h2 className="text-xl font-semibold text-gray-800">Interview Setup</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <Field
                label="Company"
                value={form.company}
                onChange={(e) => setForm((prev) => ({ ...prev, company: e.target.value }))}
              />
              <Field
                label="Role"
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              />
              <Field
                label="Focus Skill"
                value={form.skill}
                onChange={(e) => setForm((prev) => ({ ...prev, skill: e.target.value }))}
              />
            </div>

            <button
              onClick={generateQuestions}
              disabled={generating}
              className={`mt-5 rounded-lg px-5 py-3 text-sm font-medium text-white transition ${
                generating ? "cursor-wait bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {generating ? "Generating..." : "Generate Interview Questions"}
            </button>

            {questions.length > 0 && (
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-800">Interview Round</h3>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
                    {completion}% completed
                  </span>
                </div>
                <div className="space-y-5">
                  {questions.map((item, index) => (
                    <div key={item.id} className="rounded-xl border border-gray-200 p-5">
                      <div className="text-sm font-medium uppercase tracking-wide text-blue-600">
                        {item.topic}
                      </div>
                      <p className="mt-2 text-lg font-medium text-gray-800">
                        {item.question}
                      </p>
                      <textarea
                        rows={4}
                        className="mt-4 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
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
                  className={`mt-6 rounded-lg px-5 py-3 text-sm font-medium text-white transition ${
                    submitting || completion === 0
                      ? "cursor-not-allowed bg-gray-400"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {submitting ? "Evaluating..." : "Get Interview Feedback"}
                </button>
              </div>
            )}
          </section>

          <div className="space-y-8">
            <section className="rounded-2xl bg-white p-6 shadow-md">
              <h2 className="text-xl font-semibold text-gray-800">Latest Feedback</h2>
              {!report ? (
                <p className="mt-4 text-sm text-gray-500">
                  Complete an interview round to see your score, strengths, and improvement tips.
                </p>
              ) : (
                <>
                  <div className="mt-4 rounded-xl bg-blue-50 px-4 py-4">
                    <div className="text-sm text-blue-700">Overall Score</div>
                    <div className="text-4xl font-bold text-blue-800">
                      {report.overallScore}%
                    </div>
                  </div>
                  <FeedbackList title="Strengths" items={report.strengths} tone="green" />
                  <FeedbackList
                    title="Improve Next"
                    items={report.improvements}
                    tone="orange"
                  />
                  <FeedbackList title="Tips" items={report.tips} tone="blue" />
                </>
              )}
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-md">
              <h2 className="text-xl font-semibold text-gray-800">Interview History</h2>
              <div className="mt-4 space-y-3">
                {history.length === 0 ? (
                  <p className="text-sm text-gray-500">No interview sessions yet.</p>
                ) : (
                  history.slice(0, 5).map((item) => (
                    <div
                      key={item._id}
                      className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                    >
                      <div className="font-medium text-gray-800">
                        {item.company || "General"} • {item.role || "Interview"}
                      </div>
                      <div className="mt-1 text-sm text-gray-500">
                        Skill: {item.skill || "General"} • Score: {item.overallScore}%
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        {...props}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
      />
    </div>
  );
}

function FeedbackList({ title, items = [], tone }) {
  const tones = {
    green: "border-green-200 bg-green-50 text-green-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-600">
        {title}
      </h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length ? (
          items.map((item) => (
            <span
              key={`${title}-${item}`}
              className={`rounded-full border px-3 py-1 text-sm font-medium ${tones[tone]}`}
            >
              {item}
            </span>
          ))
        ) : (
          <span className="text-sm text-gray-500">No items yet.</span>
        )}
      </div>
    </div>
  );
}
