import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import StudentLayout from "../components/StudentLayout";

function buildAreaBreakdown(items, key) {
  const stats = new Map();

  items.forEach((item) => {
    const label = item[key] || "General";
    const current = stats.get(label) || { label, correct: 0, total: 0 };
    current.total += 1;
    current.correct += item.isCorrect ? 1 : 0;
    stats.set(label, current);
  });

  return [...stats.values()]
    .map((item) => ({
      ...item,
      percentage: item.total ? Math.round((item.correct / item.total) * 100) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage || a.label.localeCompare(b.label));
}

function buildInitialReport(answeredQuestions) {
  const skillBreakdown = buildAreaBreakdown(answeredQuestions, "skill");
  const categoryBreakdown = buildAreaBreakdown(answeredQuestions, "category");

  const strengths = skillBreakdown
    .filter((item) => item.percentage >= 70)
    .slice(0, 3)
    .map((item) => item.label);

  const weaknesses = skillBreakdown
    .filter((item) => item.percentage < 60)
    .slice(0, 3)
    .map((item) => item.label);

  const tips = [];
  if (strengths.length) {
    tips.push(`Keep practicing ${strengths[0]} with slightly harder questions.`);
  }
  if (weaknesses.length) {
    tips.push(`Focus first on ${weaknesses[0]} before your next attempt.`);
  }
  if (!tips.length) {
    tips.push("You are showing balanced performance. Increase difficulty gradually.");
  }

  return {
    strengths,
    weaknesses,
    tips,
    skillBreakdown,
    categoryBreakdown,
    companySuggestions: [
      {
        name: "Infosys",
        matchReason: `A strong target if your best current area is ${skillBreakdown[0]?.label || "General aptitude"}.`,
        focusAreas: weaknesses.length ? weaknesses : ["Consistency"],
      },
      {
        name: "TCS",
        matchReason: "A good fit for broad-based preparation and skill consistency.",
        focusAreas: weaknesses.length ? weaknesses : ["Core concepts"],
      },
    ],
    pointsEarned: 0,
    totalPoints: 0,
    badgesEarned: [],
  };
}

function isAnswerCorrect(question, selectedIndex) {
  const selectedText = question.options?.[selectedIndex]?.trim().toLowerCase();
  const rawAnswer =
    question.answer !== undefined && question.answer !== null
      ? question.answer
      : question.correct;

  if (typeof rawAnswer === "number") {
    return rawAnswer === selectedIndex || rawAnswer === selectedIndex + 1;
  }

  if (typeof rawAnswer === "string") {
    const normalizedAnswer = rawAnswer.trim().toLowerCase();

    return (
      normalizedAnswer === String(selectedIndex) ||
      normalizedAnswer === String(selectedIndex + 1) ||
      normalizedAnswer === selectedText
    );
  }

  return false;
}

export default function StudentQuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);

  const searchParams = new URLSearchParams(location.search);
  const activeSkill = searchParams.get("skill")?.trim() || "";
  const activeCategory = searchParams.get("category")?.trim() || "";
  const activeCompany = searchParams.get("company")?.trim() || "";
  const isCompanyTest = Boolean(activeCompany);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const fetchQuestions = async () => {
      try {
        const params = {};
        if (activeSkill) params.skill = activeSkill;
        if (activeCategory) params.category = activeCategory;
        if (activeCompany) params.company = activeCompany;

        const res = await axios.get("http://localhost:5000/api/quiz/questions", {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });
        setQuestions(res.data);
      } catch (error) {
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [activeCategory, activeCompany, activeSkill, navigate]);

  const handleNext = () => {
    if (selectedOption === null) {
      return;
    }

    const current = questions[currentQuestion];
    const isCorrect = isAnswerCorrect(current, selectedOption);
    const answeredEntry = {
      skill: current.skill,
      category: current.category,
      isCorrect,
    };

    setScore((prev) => prev + (isCorrect ? 1 : 0));
    setAnsweredQuestions((prev) => [...prev, answeredEntry]);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedOption(null);
      return;
    }

    const finalScore = score + (isCorrect ? 1 : 0);
    const finalAnsweredQuestions = [...answeredQuestions, answeredEntry];
    const report = buildInitialReport(finalAnsweredQuestions);
    setIsSubmitting(true);

    const token = localStorage.getItem("token");

    axios
      .post(
        "http://localhost:5000/api/quiz/result",
        {
          score: finalScore,
          total: questions.length,
          report,
          testType: isCompanyTest ? "company" : "initial",
          company: activeCompany,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      .then((res) => {
        const gamification = res.data?.gamification || {};
        const enrichedReport = res.data?.report || report;
        navigate("/result", {
          state: {
            score: finalScore,
            total: questions.length,
            report: {
              ...enrichedReport,
              pointsEarned:
                enrichedReport.pointsEarned ?? gamification.pointsEarned ?? 0,
              totalPoints:
                enrichedReport.totalPoints ?? gamification.totalPoints ?? 0,
              badgesEarned:
                enrichedReport.badgesEarned ?? gamification.badgesEarned ?? [],
            },
            testType: isCompanyTest ? "company" : "initial",
            company: activeCompany,
          },
          replace: true,
        });
      })
      .catch(() => {
        navigate("/result", {
          state: {
            score: finalScore,
            total: questions.length,
            report,
            testType: isCompanyTest ? "company" : "initial",
            company: activeCompany,
          },
          replace: true,
        });
      })
      .finally(() => setIsSubmitting(false));
  };

  const progress = questions.length
    ? Math.round((answeredQuestions.length / questions.length) * 100)
    : 0;

  if (isLoading) {
    return (
      <StudentLayout
        title="Loading your quiz"
        subtitle="We are preparing the next set of questions for you."
      >
        <div className="section-panel text-center text-slate-400">Loading questions...</div>
      </StudentLayout>
    );
  }

  if (!questions.length) {
    return (
      <StudentLayout
        title="No quiz available for this selection"
        subtitle="Try another filter or return to the dashboard to start a different test."
        actions={<button onClick={() => navigate("/dashboard")} className="secondary-btn">Back to Dashboard</button>}
      >
        <div className="section-panel text-sm text-slate-400">
          No questions matched the current skill, category, or company filter.
        </div>
      </StudentLayout>
    );
  }

  const current = questions[currentQuestion];

  return (
    <StudentLayout
      title={isCompanyTest ? `${activeCompany} company test` : "Focused practice quiz"}
      subtitle="Move one question at a time, stay calm, and use the progress view to keep momentum."
    >
      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
        <section className="section-panel">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="soft-badge">
                Question {currentQuestion + 1} of {questions.length}
              </div>
              <h2 className="mt-4 text-3xl font-black text-slate-100">
                {current.question}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="student-chip">
                {current.skill || "General"}
              </span>
              <span className="student-chip">
                {current.category || "General"}
              </span>
              {current.questionType ? (
                <span className="student-chip">
                  {current.questionType}
                </span>
              ) : null}
              {current.difficulty ? (
                <span className="student-chip">
                  {current.difficulty}
                </span>
              ) : null}
            </div>
          </div>

          {current.scenarioContext ? (
            <div className="mb-6 student-card text-sm leading-7 text-slate-300">
              {current.scenarioContext}
              {current.sourceLabel ? (
                <div className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {current.sourceLabel}
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="space-y-4">
            {current.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedOption(idx)}
                className={`w-full rounded-[24px] border px-5 py-4 text-left text-base font-medium transition ${
                  selectedOption === idx
                    ? "border-cyan-300/50 bg-cyan-400/10 text-slate-50 shadow-sm"
                    : "border-slate-700/60 bg-slate-900/60 text-slate-300 hover:border-cyan-300/25 hover:bg-slate-800/70"
                }`}
              >
                {option}
              </button>
            ))}
          </div>

          <div className="mt-8 flex gap-3">
            <button
              onClick={handleNext}
              disabled={selectedOption === null || isSubmitting}
              className={`primary-btn ${selectedOption === null || isSubmitting ? "cursor-not-allowed opacity-60" : ""}`}
            >
              {isSubmitting
                ? "Saving..."
                : currentQuestion < questions.length - 1
                  ? "Next Question"
                  : "Finish Quiz"}
            </button>
            <button onClick={() => navigate("/dashboard")} className="secondary-btn">
              Leave Quiz
            </button>
          </div>
        </section>

        <aside className="section-panel">
          <h3 className="text-2xl font-black text-slate-100">Progress</h3>
          <p className="mt-2 text-sm text-slate-400">
            Stay steady and keep your focus on one question at a time.
          </p>
          <div className="student-progress mt-6 h-4">
            <span style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-3 text-sm font-semibold text-slate-300">
            {progress}% completed
          </div>

          <div className="mt-8 student-card">
            <div className="text-sm uppercase tracking-[0.2em] text-slate-400">
              Current Score
            </div>
            <div className="mt-3 text-4xl font-black text-slate-100">{score}</div>
          </div>
        </aside>
      </div>
    </StudentLayout>
  );
}
