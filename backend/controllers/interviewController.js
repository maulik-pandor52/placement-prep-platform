const InterviewSession = require("../models/InterviewSession");

const interviewBank = {
  default: [
    {
      question: "Tell me about yourself and how your current technical skills fit this role.",
      topic: "Communication",
      keywords: ["skills", "project", "experience", "role"],
    },
    {
      question: "Describe a project where you solved a difficult problem. What approach did you take?",
      topic: "Problem Solving",
      keywords: ["problem", "approach", "result", "solution"],
    },
    {
      question: "How do you keep your technical knowledge current when tools and frameworks change quickly?",
      topic: "Learning Agility",
      keywords: ["learn", "update", "practice", "project"],
    },
  ],
  React: [
    {
      question: "How would you explain React component state and props to a teammate?",
      topic: "React Fundamentals",
      keywords: ["state", "props", "component", "data"],
    },
    {
      question: "What steps would you take to optimize a slow React page?",
      topic: "React Performance",
      keywords: ["render", "performance", "optimize", "profiling"],
    },
  ],
  "Node.js": [
    {
      question: "How do you structure error handling in a Node.js API?",
      topic: "Backend Fundamentals",
      keywords: ["middleware", "error", "response", "logging"],
    },
    {
      question: "What makes asynchronous programming important in Node.js?",
      topic: "Async Programming",
      keywords: ["async", "await", "event loop", "non-blocking"],
    },
  ],
  Aptitude: [
    {
      question: "How do you stay calm and accurate when solving timed aptitude problems?",
      topic: "Aptitude Strategy",
      keywords: ["time", "accuracy", "practice", "strategy"],
    },
  ],
};

const companyPrompts = {
  Infosys: "How would you communicate progress clearly while working in a structured service-based team?",
  "Tata Consultancy Services":
    "How would you adapt quickly when a client project changes scope or priorities?",
  Tatvasoft:
    "How would you contribute to a web project where delivery speed and code quality both matter?",
};

const getQuestionsForSession = ({ skill, company }) => {
  const selected = [];
  const normalizedSkill = skill?.trim();
  const normalizedCompany = company?.trim();

  if (normalizedSkill && interviewBank[normalizedSkill]) {
    selected.push(...interviewBank[normalizedSkill]);
  }

  selected.push(...interviewBank.default);

  if (normalizedCompany && companyPrompts[normalizedCompany]) {
    selected.push({
      question: companyPrompts[normalizedCompany],
      topic: `${normalizedCompany} Readiness`,
      keywords: ["team", "delivery", "communication", "adapt"],
    });
  }

  return selected.slice(0, 5);
};

const scoreAnswer = ({ answer = "", keywords = [] }) => {
  const normalized = answer.trim().toLowerCase();
  if (!normalized) {
    return { score: 0, feedback: "Add a more complete answer with examples and outcomes." };
  }

  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const lengthScore = Math.min(wordCount / 40, 1) * 45;
  const keywordHits = keywords.filter((item) => normalized.includes(item.toLowerCase())).length;
  const keywordScore = keywords.length ? (keywordHits / keywords.length) * 55 : 35;
  const score = Math.round(lengthScore + keywordScore);

  let feedback = "Good start. Add one concrete example to make your answer stronger.";
  if (score >= 80) {
    feedback = "Strong answer. You explained your thinking clearly and used relevant terms.";
  } else if (score >= 60) {
    feedback = "Decent answer. Add clearer structure and one measurable outcome.";
  } else if (score >= 40) {
    feedback = "Needs more depth. Mention your approach, tools, and final result.";
  }

  return { score, feedback };
};

exports.getInterviewQuestions = async (req, res) => {
  try {
    const { skill = "", company = "", role = "" } = req.query;
    const questions = getQuestionsForSession({ skill, company }).map((item, index) => ({
      id: index + 1,
      question: item.question,
      topic: item.topic,
      role,
    }));

    res.json({ questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveInterviewSession = async (req, res) => {
  try {
    const { company = "", role = "", skill = "", answers = [] } = req.body;

    const questionSet = getQuestionsForSession({ skill, company });
    const scoredAnswers = questionSet.map((item, index) => {
      const submitted = answers[index]?.answer || "";
      const { score, feedback } = scoreAnswer({
        answer: submitted,
        keywords: item.keywords,
      });

      return {
        question: item.question,
        answer: submitted,
        score,
        feedback,
        topic: item.topic,
      };
    });

    const overallScore = scoredAnswers.length
      ? Math.round(
          scoredAnswers.reduce((sum, item) => sum + item.score, 0) / scoredAnswers.length,
        )
      : 0;

    const strengths = scoredAnswers
      .filter((item) => item.score >= 70)
      .slice(0, 3)
      .map((item) => item.topic);

    const improvements = scoredAnswers
      .filter((item) => item.score < 60)
      .slice(0, 3)
      .map((item) => item.topic);

    const tips = [];
    if (strengths[0]) {
      tips.push(`Keep using clear examples when discussing ${strengths[0]}.`);
    }
    if (improvements[0]) {
      tips.push(`Practice shorter, more structured responses for ${improvements[0]}.`);
    }
    if (company) {
      tips.push(`Research recent ${company} projects so your answers feel more company-specific.`);
    }
    if (!tips.length) {
      tips.push("Keep practicing concise STAR-style answers with clear outcomes.");
    }

    const session = await InterviewSession.create({
      userId: req.user.id,
      company: company.trim(),
      role: role.trim(),
      skill: skill.trim(),
      overallScore,
      strengths,
      improvements,
      tips,
      answers: scoredAnswers,
    });

    res.status(201).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getInterviewHistory = async (req, res) => {
  try {
    const sessions = await InterviewSession.find({ userId: req.user.id }).sort({
      createdAt: -1,
    });

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
