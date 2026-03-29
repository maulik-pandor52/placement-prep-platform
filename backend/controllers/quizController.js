const Question = require("../models/Question");
const QuizResult = require("../models/QuizResult");
const User = require("../models/User");
const Company = require("../models/Company");
const defaultCompanies = require("../data/defaultCompanies");
const { fetchLiveMarketTrends } = require("../services/marketTrendsService");

let defaultCompaniesEnsured = false;

const ensureDefaultCompanies = async () => {
  if (defaultCompaniesEnsured) {
    return;
  }

  await Promise.all(
    defaultCompanies.map((company) =>
      Company.updateOne({ name: company.name }, { $setOnInsert: company }, { upsert: true }),
    ),
  );

  defaultCompaniesEnsured = true;
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeCompanyName = (value = "") => value.trim();

const scoreQuestionForCompany = (question, company) => {
  let score = 0;
  const normalizedQuestionCompany = normalizeCompanyName(question.company || "").toLowerCase();
  const normalizedCompany = normalizeCompanyName(company.name).toLowerCase();

  if (normalizedQuestionCompany && normalizedQuestionCompany === normalizedCompany) {
    score += 100;
  }

  const requiredSkill = (company.requiredSkills || []).find(
    (item) => item.name.toLowerCase() === String(question.skill || "").toLowerCase(),
  );

  if (requiredSkill) {
    score += requiredSkill.priority * 10;
  }

  if (
    (company.preferredCategories || []).some(
      (category) => category.toLowerCase() === String(question.category || "").toLowerCase(),
    )
  ) {
    score += 12;
  }

  if (!normalizedQuestionCompany) {
    score += 5;
  }

  if ((question.questionType || "").toLowerCase() === "company_scenario") {
    score += 20;
  }

  if ((question.questionType || "").toLowerCase() === "case_based") {
    score += 16;
  }

  return score;
};

const buildScenarioQuestionOptions = ({ company, skill, category }) => {
  const rolePhrase = company.hiringFocus || `${company.name} entry-level role`;
  return [
    `Clarify the requirement, explain a tradeoff, and deliver a practical ${skill} solution for the ${rolePhrase}.`,
    `Skip the requirement details and immediately rewrite everything without validating the impact.`,
    `Wait for someone else to solve it because company-specific constraints are too risky to handle.`,
    `Focus only on UI polish even when the scenario is mainly about ${category.toLowerCase()}.`,
  ];
};

const generateCompanyScenarioQuestions = (company, count = 4) => {
  const skillEntries = company.requiredSkills?.length
    ? company.requiredSkills
    : (company.focusSkills || []).map((name, index) => ({
        name,
        priority: Math.max(1, 5 - index),
      }));

  return skillEntries.slice(0, count).map((skillEntry, index) => {
    const category =
      company.preferredCategories?.[index % Math.max(company.preferredCategories?.length || 1, 1)] ||
      "Technical";
    const skill = skillEntry.name || company.focusSkills?.[0] || "General";
    const options = buildScenarioQuestionOptions({ company, skill, category });

    return {
      _id: `generated-${company.name}-${skill}-${index}`.replace(/\s+/g, "-").toLowerCase(),
      question: `${company.name} scenario: during a ${category.toLowerCase()} round, you are asked to apply ${skill} in a real project situation. What is the strongest response?`,
      options,
      answer: 0,
      skill,
      category,
      company: company.name,
      questionType: "company_scenario",
      difficulty: company.difficultyLevel || "medium",
      scenarioContext: `${company.name} commonly evaluates ${skill} through ${company.assessmentPattern?.[0] || "technical screening"} and expects practical decision making.`,
      sourceLabel: `Generated from ${company.name} hiring focus and assessment pattern`,
      tags: [company.name, skill, category, "scenario"],
    };
  });
};

const buildAreaMap = (items = []) =>
  new Map(items.map((item) => [String(item.label || "").toLowerCase(), item]));

const computeCompanyFit = ({ company, skillBreakdown, categoryBreakdown }) => {
  const skillMap = buildAreaMap(skillBreakdown);
  const categoryMap = buildAreaMap(categoryBreakdown);
  const weightedSkills = company.requiredSkills?.length
    ? company.requiredSkills
    : (company.focusSkills || []).map((name) => ({
        name,
        priority: 2,
        targetScore: company.benchmarkScore || 70,
      }));

  let totalWeight = 0;
  let weightedScore = 0;

  weightedSkills.forEach((item) => {
    const currentScore = skillMap.get(String(item.name).toLowerCase())?.percentage || 0;
    const weight = item.priority || 1;
    weightedScore += currentScore * weight;
    totalWeight += weight;
  });

  const preferredCategoryScores = (company.preferredCategories || [])
    .map((category) => categoryMap.get(String(category).toLowerCase())?.percentage || 0)
    .filter((value) => value > 0);

  const baseScore = totalWeight ? weightedScore / totalWeight : 0;
  const categoryBonus = preferredCategoryScores.length
    ? preferredCategoryScores.reduce((sum, value) => sum + value, 0) /
      preferredCategoryScores.length
    : baseScore;

  const readinessScore = Math.round(baseScore * 0.75 + categoryBonus * 0.25);
  const benchmarkGap = readinessScore - (company.benchmarkScore || 70);

  return {
    readinessScore,
    benchmarkGap,
  };
};

const calculatePercentile = (sortedValues, value) => {
  if (!sortedValues.length) {
    return 0;
  }

  const belowOrEqual = sortedValues.filter((item) => item <= value).length;
  return Math.round((belowOrEqual / sortedValues.length) * 100);
};

const buildAdvancedReport = ({
  report = {},
  companyTestName = "",
  companies = [],
  attemptCount = 1,
}) => {
  const skillBreakdown = report.skillBreakdown || [];
  const categoryBreakdown = report.categoryBreakdown || [];
  const strengths = report.strengths || [];
  const weaknesses = report.weaknesses || [];

  const rankedCompanies = companies
    .map((company) => {
      const fit = computeCompanyFit({
        company,
        skillBreakdown,
        categoryBreakdown,
      });

      return {
        company,
        ...fit,
      };
    })
    .sort((a, b) => b.readinessScore - a.readinessScore || b.benchmarkGap - a.benchmarkGap);

  const targetCompany =
    rankedCompanies.find(
      (entry) =>
        normalizeCompanyName(entry.company.name).toLowerCase() ===
        normalizeCompanyName(companyTestName).toLowerCase(),
    ) || rankedCompanies[0];

  const readinessScore = targetCompany?.readinessScore || 0;
  const benchmarkScore = targetCompany?.company?.benchmarkScore || 70;
  const benchmarkGap = readinessScore - benchmarkScore;

  let readinessLevel = "Needs Work";
  if (readinessScore >= 80) readinessLevel = "Interview Ready";
  else if (readinessScore >= 68) readinessLevel = "Almost Ready";
  else if (readinessScore >= 50) readinessLevel = "Developing";

  const skillGapAnalysis = (targetCompany?.company?.requiredSkills || [])
    .map((requiredSkill) => {
      const currentScore =
        skillBreakdown.find(
          (item) =>
            String(item.label || "").toLowerCase() ===
            String(requiredSkill.name || "").toLowerCase(),
        )?.percentage || 0;

      return {
        label: requiredSkill.name,
        currentScore,
        targetScore: requiredSkill.targetScore || benchmarkScore,
        gap: Math.max((requiredSkill.targetScore || benchmarkScore) - currentScore, 0),
        priority: requiredSkill.priority || 1,
      };
    })
    .sort((a, b) => b.gap - a.gap || b.priority - a.priority)
    .slice(0, 5);

  const improvementRoadmap = skillGapAnalysis.length
    ? skillGapAnalysis.slice(0, 3).map((item, index) => {
        const prefix = index === 0 ? "Immediate focus" : index === 1 ? "Next priority" : "Stretch goal";
        return `${prefix}: raise ${item.label} from ${item.currentScore}% toward ${item.targetScore}%.`;
      })
    : ["Maintain your stronger skills and keep building consistency across company tests."];

  const categoryInsights = categoryBreakdown
    .slice(0, 3)
    .map(
      (item) =>
        `${item.label}: ${item.percentage}% accuracy across ${item.total} question${item.total === 1 ? "" : "s"}.`,
    );

  const companySuggestions = rankedCompanies.slice(0, 3).map((entry) => ({
    name: entry.company.name,
    matchReason: `${entry.company.name} aligns with your current profile in ${
      strengths[0] || entry.company.focusSkills?.[0] || "core placement skills"
    } and expects a benchmark near ${entry.company.benchmarkScore || 70}%.`,
    focusAreas:
      skillGapAnalysis.length > 0
        ? skillGapAnalysis.slice(0, 3).map((item) => item.label)
        : weaknesses.length
          ? weaknesses
          : entry.company.focusSkills?.slice(0, 3) || [],
    readinessScore: entry.readinessScore,
    benchmarkGap: entry.benchmarkGap,
  }));

  const readinessSummary = targetCompany
    ? `${readinessLevel}: your estimated readiness for ${targetCompany.company.name} is ${readinessScore}% against a benchmark of ${benchmarkScore}%.`
    : `Current readiness is ${readinessScore}%. Keep practicing to improve confidence and company fit.`;

  const baseTips = report.tips || [];
  const combinedTips = [...baseTips];

  if (skillGapAnalysis[0]) {
    combinedTips.push(
      `Close the biggest company-aligned gap in ${skillGapAnalysis[0].label} by targeting at least ${skillGapAnalysis[0].targetScore}%.`,
    );
  }

  if (attemptCount < 3) {
    combinedTips.push("Take at least two more focused tests to make your readiness analytics more reliable.");
  }

  return {
    ...report,
    tips: [...new Set(combinedTips)].slice(0, 5),
    companySuggestions,
    readinessScore,
    readinessLevel,
    benchmarkScore,
    benchmarkGap,
    readinessSummary,
    improvementRoadmap,
    categoryInsights,
    skillGapAnalysis,
  };
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

const ensureStudentAccess = async (req, res) => {
  if (!req.user?.id) {
    res.status(401).json({ message: "Unauthorized" });
    return null;
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    res.status(404).json({ message: "User not found" });
    return null;
  }

  if (user.role === "admin") {
    res.status(403).json({ message: "Admin accounts cannot access student quiz data" });
    return null;
  }

  return user;
};

exports.getQuestions = async (req, res) => {
  try {
    await ensureDefaultCompanies();
    const user = await ensureStudentAccess(req, res);
    if (!user) {
      return;
    }

    const { skill, category, company } = req.query;
    const filters = {};
    const normalizedCompany = normalizeCompanyName(company || "");

    if (skill) {
      filters.skill = new RegExp(`^${escapeRegex(skill.trim())}$`, "i");
    }

    if (category) {
      filters.category = new RegExp(`^${escapeRegex(category.trim())}$`, "i");
    }

    if (normalizedCompany) {
      const companyDoc = await Company.findOne({
        name: new RegExp(`^${escapeRegex(normalizedCompany)}$`, "i"),
      });

      const baseQuestions = await Question.find(filters);

      if (companyDoc) {
        const ranked = baseQuestions
          .map((question) => ({
            question,
            score: scoreQuestionForCompany(question, companyDoc),
          }))
          .filter((entry) => entry.score > 0)
          .sort((a, b) => b.score - a.score)
          .map((entry) => entry.question);

        const generated = generateCompanyScenarioQuestions(companyDoc, 4).filter(
          (generatedQuestion) =>
            !ranked.some(
              (item) =>
                String(item.question).trim().toLowerCase() ===
                String(generatedQuestion.question).trim().toLowerCase(),
            ),
        );

        const combined = [...ranked, ...generated];
        const limit = Math.min(Math.max(combined.length, 0), 12);
        return res.json(limit ? combined.slice(0, limit) : combined);
      }

      const companyQuestions = baseQuestions.filter(
        (question) =>
          normalizeCompanyName(question.company || "").toLowerCase() ===
          normalizedCompany.toLowerCase(),
      );

      return res.json(companyQuestions);
    }

    const questions = await Question.find(filters);
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveResult = async (req, res) => {
  try {
    await ensureDefaultCompanies();

    const { score, total, report, testType, company } = req.body;
    const user = await ensureStudentAccess(req, res);
    if (!user) {
      return;
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
    const companies = await Company.find().sort({ benchmarkScore: -1, name: 1 });
    const enrichedReport = buildAdvancedReport({
      report,
      companyTestName: company,
      companies,
      attemptCount,
    });

    const result = new QuizResult({
      userId: req.user.id,
      score,
      total,
      testType: testType === "company" ? "company" : "initial",
      company: company?.trim() || "",
      report: {
        strengths: enrichedReport?.strengths || [],
        weaknesses: enrichedReport?.weaknesses || [],
        tips: enrichedReport?.tips || [],
        skillBreakdown: enrichedReport?.skillBreakdown || [],
        categoryBreakdown: enrichedReport?.categoryBreakdown || [],
        companySuggestions: enrichedReport?.companySuggestions || [],
        pointsEarned,
        totalPoints,
        badgesEarned,
        readinessScore: enrichedReport?.readinessScore || 0,
        readinessLevel: enrichedReport?.readinessLevel || "Needs Work",
        benchmarkScore: enrichedReport?.benchmarkScore || 0,
        benchmarkGap: enrichedReport?.benchmarkGap || 0,
        readinessSummary: enrichedReport?.readinessSummary || "",
        improvementRoadmap: enrichedReport?.improvementRoadmap || [],
        categoryInsights: enrichedReport?.categoryInsights || [],
        skillGapAnalysis: enrichedReport?.skillGapAnalysis || [],
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
      report: {
        ...enrichedReport,
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
    const user = await ensureStudentAccess(req, res);
    if (!user) {
      return;
    }

    const results = await QuizResult.find({
      userId: user._id,
    }).sort({ createdAt: -1 });

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const user = await ensureStudentAccess(req, res);
    if (!user) {
      return;
    }

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
    await ensureDefaultCompanies();
    const user = await ensureStudentAccess(req, res);
    if (!user) {
      return;
    }

    const results = await QuizResult.find({ userId: user._id }).sort({ createdAt: -1 });
    const allStudentResults = await QuizResult.find().sort({ createdAt: -1 });
    const skillMap = new Map();
    const companies = await Company.find();
    const demandMap = new Map();

    companies.forEach((company) => {
      (company.requiredSkills || []).forEach((skill) => {
        const current = demandMap.get(skill.name) || { weight: 0, total: 0 };
        current.weight += (skill.priority || 1) * 18;
        current.total += 1;
        demandMap.set(skill.name, current);
      });
    });

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
        demand: Math.min(
          95,
          Math.max(
            60,
            Math.round(
              (demandMap.get(item.label)?.weight || 65) /
                Math.max(demandMap.get(item.label)?.total || 1, 1),
            ),
          ),
        ),
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

    const latestResultsByUser = new Map();

    allStudentResults.forEach((result) => {
      const key = String(result.userId);
      if (!latestResultsByUser.has(key)) {
        latestResultsByUser.set(key, result);
      }
    });

    const peerResults = [...latestResultsByUser.values()];
    const peerOverallPercentages = peerResults.map((result) =>
      Math.round((result.score / Math.max(result.total || 1, 1)) * 100),
    );
    const currentOverall =
      peerResults.find((result) => String(result.userId) === String(user._id)) || results[0];
    const currentOverallPercentage = currentOverall
      ? Math.round((currentOverall.score / Math.max(currentOverall.total || 1, 1)) * 100)
      : 0;
    const sortedPeerOverall = [...peerOverallPercentages].sort((a, b) => a - b);
    const peerAverage =
      peerOverallPercentages.length > 0
        ? Math.round(
            peerOverallPercentages.reduce((sum, value) => sum + value, 0) /
              peerOverallPercentages.length,
          )
        : 0;
    const peerPercentile = calculatePercentile(sortedPeerOverall, currentOverallPercentage);
    const peerRank =
      peerOverallPercentages.filter((value) => value > currentOverallPercentage).length + 1;

    const peerSkillBuckets = new Map();

    peerResults.forEach((result) => {
      (result.report?.skillBreakdown || []).forEach((skill) => {
        const bucket = peerSkillBuckets.get(skill.label) || [];
        bucket.push(skill.percentage);
        peerSkillBuckets.set(skill.label, bucket);
      });
    });

    const peerSkillComparison = trackedSkills.map((skill) => {
      const peerValues = peerSkillBuckets.get(skill.label) || [];
      const peerAverageSkill = peerValues.length
        ? Math.round(peerValues.reduce((sum, value) => sum + value, 0) / peerValues.length)
        : 0;
      const percentile = calculatePercentile([...peerValues].sort((a, b) => a - b), skill.latest);

      return {
        label: skill.label,
        yourScore: skill.latest,
        peerAverage: peerAverageSkill,
        gap: skill.latest - peerAverageSkill,
        percentile,
      };
    });

    const strengthsVsPeers = peerSkillComparison
      .filter((item) => item.gap >= 5)
      .sort((a, b) => b.gap - a.gap)
      .slice(0, 3)
      .map((item) => item.label);

    const needsVsPeers = peerSkillComparison
      .filter((item) => item.gap < 0)
      .sort((a, b) => a.gap - b.gap)
      .slice(0, 3)
      .map((item) => item.label);

    const fallbackIndustryTrends = companies
      .map((company) => {
        const topSkill = [...(company.requiredSkills || [])].sort(
          (a, b) => (b.priority || 0) - (a.priority || 0),
        )[0];
        const demand =
          topSkill && demandMap.get(topSkill.name)
            ? Math.min(
                96,
                Math.max(
                  60,
                  Math.round(
                    demandMap.get(topSkill.name).weight /
                      Math.max(demandMap.get(topSkill.name).total, 1),
                  ),
                ),
              )
            : 68;

        return {
          company: company.name,
          industry: company.industry || "Technology",
          topSkill: topSkill?.name || company.focusSkills?.[0] || "General Skills",
          demandScore: demand,
          benchmarkScore: company.benchmarkScore || 70,
          growthLabel:
            demand >= 85 ? "High growth" : demand >= 75 ? "Steady growth" : "Emerging demand",
          topRoles:
            company.assessmentPattern?.slice(0, 2) || ["Campus assessment", "Technical round"],
          sourceLabel: "Curated market snapshot",
        };
      })
      .sort((a, b) => b.demandScore - a.demandScore || b.benchmarkScore - a.benchmarkScore)
      .slice(0, 5);

    const industryTrends = await fetchLiveMarketTrends(
      companies.sort((a, b) => (b.benchmarkScore || 0) - (a.benchmarkScore || 0)),
    );

    res.json({
      trackedSkills,
      recommendedFocus,
      peerComparison: {
        cohortSize: peerResults.length,
        averageScore: peerAverage,
        yourScore: currentOverallPercentage,
        percentile: peerPercentile,
        rank: peerRank,
        strengthsVsPeers,
        needsVsPeers,
        skillComparison: peerSkillComparison
          .sort((a, b) => b.percentile - a.percentile || b.gap - a.gap)
          .slice(0, 6),
      },
      industryTrends: industryTrends.length ? industryTrends : fallbackIndustryTrends,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
