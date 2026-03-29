const Question = require("../models/Question");
const QuizResult = require("../models/QuizResult");
const User = require("../models/User");

const companyProfiles = {
  "Tata Consultancy Services": {
    skills: ["Aptitude", "Problem Solving", "JavaScript", "React"],
    categories: ["Aptitude", "MCQ"],
  },
  Infosys: {
    skills: ["Aptitude", "JavaScript", "React", "Communication"],
    categories: ["Aptitude", "Technical"],
  },
  Tatvasoft: {
    skills: ["React", "JavaScript", "Node.js", "MongoDB"],
    categories: ["Technical", "Coding"],
  },
};

const buildGamification = ({ score, total, testType, attemptCount, existingBadges }) => {
  const percentage = total ? Math.round((score / total) * 100) : 0;
  const pointsEarned =
    score * 10 +
    (percentage >= 80 ? 20 : 0) +
    (testType === "company" ? 15 : 0);

  const badgesEarned = [];

  if (attemptCount === 1 && !existingBadges.includes("First Step")) {
    badgesEarned.push("First Step");
  }

  if (percentage >= 80 && !existingBadges.includes("High Scorer")) {
    badgesEarned.push("High Scorer");
  }

  if (percentage === 100 && !existingBadges.includes("Perfect Run")) {
    badgesEarned.push("Perfect Run");
  }

  if (testType === "company" && !existingBadges.includes("Company Challenger")) {
    badgesEarned.push("Company Challenger");
  }

  if (attemptCount >= 5 && !existingBadges.includes("Consistency Star")) {
    badgesEarned.push("Consistency Star");
  }

  return { pointsEarned, badgesEarned };
};

exports.getQuestions = async (req, res) => {
  try {
    const { skill, category, company } = req.query;
    const filters = {};
    const normalizedCompany = company?.trim();

    if (skill) {
      filters.skill = new RegExp(`^${skill.trim()}$`, "i");
    }

    if (category) {
      filters.category = new RegExp(`^${category.trim()}$`, "i");
    }

    if (normalizedCompany) {
      const profile = companyProfiles[normalizedCompany];
      const companyMatcher = { company: new RegExp(`^${normalizedCompany}$`, "i") };

      if (profile) {
        const fallbackMatchers = [];

        if (!skill && profile.skills?.length) {
          fallbackMatchers.push({
            skill: {
              $in: profile.skills.map((item) => new RegExp(`^${item}$`, "i")),
            },
          });
        }

        if (!category && profile.categories?.length) {
          fallbackMatchers.push({
            category: {
              $in: profile.categories.map((item) => new RegExp(`^${item}$`, "i")),
            },
          });
        }

        filters.$or = [companyMatcher, ...fallbackMatchers];
      } else {
        filters.company = companyMatcher.company;
      }
    }

    const questions = await Question.find(filters);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveResult = async (req, res) => {
  try {
    const { score, total, report, testType, company } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const attemptCount = (user.totalQuizzes || 0) + 1;
    const { pointsEarned, badgesEarned } = buildGamification({
      score,
      total,
      testType,
      attemptCount,
      existingBadges: user.badges || [],
    });

    const updatedBadges = [...new Set([...(user.badges || []), ...badgesEarned])];
    const totalPoints = (user.points || 0) + pointsEarned;

    const result = new QuizResult({
      userId: req.user.id,
      score,
      total,
      testType: testType === "company" ? "company" : "initial",
      company: company?.trim() || "",
      report: {
        strengths: report?.strengths || [],
        weaknesses: report?.weaknesses || [],
        tips: report?.tips || [],
        skillBreakdown: report?.skillBreakdown || [],
        categoryBreakdown: report?.categoryBreakdown || [],
        companySuggestions: report?.companySuggestions || [],
        pointsEarned,
        totalPoints,
        badgesEarned,
      },
    });

    await result.save();
    user.points = totalPoints;
    user.badges = updatedBadges;
    user.totalQuizzes = attemptCount;
    await user.save();

    res.json({
      message: "Result saved successfully",
      gamification: {
        pointsEarned,
        totalPoints,
        badgesEarned,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getResults = async (req, res) => {
  try {
    const results = await QuizResult.find({
      userId: req.user.id,
    }).sort({ createdAt: -1 });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const leaderboard = await User.find({ role: "student" })
      .select("name email points badges totalQuizzes")
      .sort({ points: -1, totalQuizzes: -1, createdAt: 1 })
      .limit(10);

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSkillTracker = async (req, res) => {
  try {
    const results = await QuizResult.find({ userId: req.user.id }).sort({ createdAt: -1 });
    const skillMap = new Map();
    const industryDemand = {
      React: 88,
      "Node.js": 82,
      MongoDB: 76,
      JavaScript: 90,
      Aptitude: 70,
      Communication: 85,
      "Problem Solving": 92,
    };

    results.forEach((result, index) => {
      const breakdown = result.report?.skillBreakdown || [];
      breakdown.forEach((item) => {
        const current = skillMap.get(item.label) || {
          label: item.label,
          attempts: 0,
          percentages: [],
        };

        current.attempts += 1;
        current.percentages.push({
          value: item.percentage,
          recency: index,
        });
        skillMap.set(item.label, current);
      });
    });

    const trackedSkills = [...skillMap.values()].map((item) => {
      const ordered = item.percentages.sort((a, b) => a.recency - b.recency);
      const latest = ordered[0]?.value || 0;
      const oldest = ordered[ordered.length - 1]?.value || latest;
      const average = Math.round(
        ordered.reduce((sum, entry) => sum + entry.value, 0) / ordered.length,
      );

      return {
        label: item.label,
        attempts: item.attempts,
        latest,
        average,
        trend: latest - oldest,
        demand: industryDemand[item.label] || 65,
      };
    });

    trackedSkills.sort((a, b) => b.demand - a.demand || b.latest - a.latest);

    const recommendedFocus = trackedSkills
      .filter((item) => item.latest < 70)
      .slice(0, 3)
      .map((item) => ({
        label: item.label,
        reason: `${item.label} is trending in industry demand (${item.demand}%) and your latest score is ${item.latest}%.`,
      }));

    res.json({
      trackedSkills,
      recommendedFocus,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
