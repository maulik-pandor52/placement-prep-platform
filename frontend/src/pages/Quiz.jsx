// src/pages/Quiz.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

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
    tips.push(
      `Keep practicing ${strengths[0]} with slightly harder questions to maintain momentum.`,
    );
  }

  if (weaknesses.length) {
    tips.push(
      `Focus first on ${weaknesses[0]} and review its core concepts before your next attempt.`,
    );
  }

  const weakestCategory = categoryBreakdown.find((item) => item.percentage < 60);
  if (weakestCategory) {
    tips.push(
      `Spend extra time on ${weakestCategory.label.toLowerCase()} questions to improve consistency.`,
    );
  }

  if (!tips.length) {
    tips.push(
      "You are showing balanced performance. Keep revising and increase question difficulty gradually.",
    );
  }

  const companySuggestions = buildCompanySuggestions({
    skillBreakdown,
    strengths,
    weaknesses,
  });

  return {
    strengths,
    weaknesses,
    tips,
    skillBreakdown,
    categoryBreakdown,
    companySuggestions,
    pointsEarned: 0,
    totalPoints: 0,
    badgesEarned: [],
  };
}

function buildCompanySuggestions({ skillBreakdown, strengths, weaknesses }) {
  const bestSkill = skillBreakdown[0]?.label || "General Problem Solving";
  const focusAreas = weaknesses.length ? weaknesses : ["Consistency", "Core concepts"];

  const suggestions = [
    {
      name: "Tata Consultancy Services",
      matchReason: `A good fit for building a broad foundation, especially if you are doing well in ${bestSkill}.`,
      focusAreas,
    },
    {
      name: "Infosys",
      matchReason: `Suitable for structured preparation and balanced skill growth with strengths in ${strengths[0] || bestSkill}.`,
      focusAreas,
    },
    {
      name: "Tatvasoft",
      matchReason: `Worth targeting if you want to turn ${bestSkill} into a stronger interview advantage.`,
      focusAreas,
    },
  ];

  return suggestions.slice(0, 3);
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

export default function Quiz() {
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
        setIsLoading(true);
        const params = {};

        if (activeSkill) {
          params.skill = activeSkill;
        }

        if (activeCategory) {
          params.category = activeCategory;
        }

        if (activeCompany) {
          params.company = activeCompany;
        }

        const res = await axios.get(
          "http://localhost:5000/api/quiz/questions",
          {
            headers: { Authorization: `Bearer ${token}` },
            params,
          },
        );
        setQuestions(res.data);
      } catch (error) {
        console.error("Error loading questions:", error);
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
      alert("Please select an option first!");
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
    } else {
      // Last question → save & go to result
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
          const finalReport = {
            ...report,
            pointsEarned: gamification.pointsEarned || 0,
            totalPoints: gamification.totalPoints || 0,
            badgesEarned: gamification.badgesEarned || [],
          };
          const storedUser = JSON.parse(localStorage.getItem("user") || "null");
          if (storedUser) {
            localStorage.setItem(
              "user",
              JSON.stringify({
                ...storedUser,
                points: finalReport.totalPoints,
                badges: [
                  ...new Set([
                    ...(storedUser.badges || []),
                    ...(finalReport.badgesEarned || []),
                  ]),
                ],
              }),
            );
          }

          navigate("/result", {
            state: {
              score: finalScore,
              total: questions.length,
              report: finalReport,
              testType: isCompanyTest ? "company" : "initial",
              company: activeCompany,
            },
            replace: true,
          });
        })
        .catch((err) => {
          console.error("Error saving result:", err);
          alert("Failed to save result. Showing score anyway...");
          const fallbackReport = {
            ...report,
            pointsEarned: 0,
            totalPoints: 0,
            badgesEarned: [],
          };
          navigate("/result", {
            state: {
              score: finalScore,
              total: questions.length,
              report: fallbackReport,
              testType: isCompanyTest ? "company" : "initial",
              company: activeCompany,
            },
            replace: true,
          });
        })
        .finally(() => setIsSubmitting(false));
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <h2 className="text-xl font-medium text-gray-600">
          Loading questions...
        </h2>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-xl rounded-xl bg-white p-8 text-center shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800">
            No questions found
          </h2>
          <p className="mt-3 text-gray-600">
            {activeSkill || activeCategory || activeCompany
              ? `No questions match the selected filters${activeCompany ? ` for company "${activeCompany}"` : ""}${activeSkill ? ` for skill "${activeSkill}"` : ""}${activeCategory ? ` and category "${activeCategory}"` : ""}.`
              : "There are no questions available yet."}
          </p>
          <button
            onClick={() => navigate("/dashboard", { replace: true })}
            className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white transition hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const current = questions[currentQuestion];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg p-8">
        {isCompanyTest && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            Company Test: <span className="font-semibold">{activeCompany}</span>
          </div>
        )}
        <h2 className="text-2xl font-bold mb-6 text-center">
          Question {currentQuestion + 1} of {questions.length}
        </h2>

        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
            Skill: {current.skill || "General"}
          </span>
          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
            Category: {current.category || "General"}
          </span>
        </div>

        <p className="text-lg mb-8 leading-relaxed">{current.question}</p>

        <div className="grid gap-4 mb-10">
          {current.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedOption(idx)}
              className={`p-4 text-left border rounded-lg transition-all
                ${
                  selectedOption === idx
                    ? "bg-blue-100 border-blue-500 ring-2 ring-blue-300"
                    : "hover:bg-gray-50 border-gray-300"
                }`}
            >
              {option}
            </button>
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={selectedOption === null || isSubmitting}
          className={`w-full py-3 rounded-lg font-medium text-white transition
            ${
              selectedOption !== null && !isSubmitting
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
        >
          {isSubmitting
            ? "Saving..."
            : currentQuestion < questions.length - 1
              ? "Next"
              : "Finish Quiz"}
        </button>
      </div>
    </div>
  );
}
