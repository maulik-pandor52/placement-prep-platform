const User = require("../models/User");
const Question = require("../models/Question");
const QuizResult = require("../models/QuizResult");
const Skill = require("../models/Skill");
const Company = require("../models/Company");
const InterviewSession = require("../models/InterviewSession");
const defaultCompanies = require("../data/defaultCompanies");
const bcrypt = require("bcryptjs");
const { buildActivitySummary } = require("../utils/activityTracker");

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

const normalizeStringArray = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const buildQuestionPayload = (body) => {
  const question = body.question?.trim();
  const options = Array.isArray(body.options)
    ? body.options.map((item) => String(item).trim()).filter(Boolean)
    : [];
  const answer = Number(body.answer);
  const skill = body.skill?.trim() || "General";
  const category = body.category?.trim() || "General";
  const company = body.company?.trim() || "";
  const questionType = body.questionType?.trim() || "mcq";
  const difficulty = body.difficulty?.trim() || "medium";
  const scenarioContext = body.scenarioContext?.trim() || "";
  const sourceLabel = body.sourceLabel?.trim() || "";
  const tags = normalizeStringArray(body.tags);

  return {
    question,
    options,
    answer,
    skill,
    category,
    company,
    questionType,
    difficulty,
    scenarioContext,
    sourceLabel,
    tags,
  };
};

const validateQuestionPayload = ({ question, options, answer }) => {
  if (!question || options.length < 2) {
    return "Question and at least two options are required";
  }

  if (!Number.isInteger(answer) || answer < 0 || answer >= options.length) {
    return "Answer must match one of the provided options";
  }

  return "";
};

const buildSkillPayload = (body) => ({
  name: body.name?.trim(),
  category: body.category?.trim() || "General",
  description: body.description?.trim() || "",
});

const validateSkillPayload = ({ name }) => {
  if (!name) {
    return "Skill name is required";
  }

  return "";
};

const buildCompanyPayload = (body) => ({
  name: body.name?.trim(),
  description: body.description?.trim() || "",
  focusSkills: normalizeStringArray(body.focusSkills),
  preferredCategories: normalizeStringArray(body.preferredCategories),
  industry: body.industry?.trim() || "Technology",
  hiringFocus: body.hiringFocus?.trim() || "",
  assessmentPattern: normalizeStringArray(body.assessmentPattern),
  benchmarkScore: Number(body.benchmarkScore) || 70,
  difficultyLevel: body.difficultyLevel?.trim() || "medium",
  requiredSkills: normalizeStringArray(body.requiredSkills || body.focusSkills).map(
    (name, index) => ({
      name,
      priority: Math.max(1, 5 - index),
      targetScore: Number(body.targetScore) || 70,
    }),
  ),
  jobApiCountry: body.jobApiCountry?.trim() || "in",
  jobSearchTerms: normalizeStringArray(body.jobSearchTerms),
});

const validateCompanyPayload = ({ name }) => {
  if (!name) {
    return "Company name is required";
  }

  return "";
};

const buildAdminUserPayload = (body) => ({
  name: body.name?.trim(),
  email: body.email?.trim().toLowerCase(),
  password: body.password || "",
});

const validateAdminUserPayload = ({ name, email, password }) => {
  if (!name || name.length < 2) {
    return "Admin name must be at least 2 characters";
  }

  if (!email || !email.includes("@")) {
    return "A valid admin email is required";
  }

  if (!password || password.length < 6) {
    return "Admin password must be at least 6 characters";
  }

  return "";
};

exports.getOverview = async (req, res) => {
  try {
    await ensureDefaultCompanies();

    const [
      userCount,
      questionCount,
      resultCount,
      skillCount,
      companyCount,
      interviewCount,
      users,
      results,
      interviews,
      questions,
      skills,
      companies,
    ] = await Promise.all([
      User.countDocuments(),
      Question.countDocuments(),
      QuizResult.countDocuments(),
      Skill.countDocuments(),
      Company.countDocuments(),
      InterviewSession.countDocuments(),
      User.find()
        .select("name email role createdAt badges activityLog")
        .sort({ createdAt: -1 })
        .limit(8),
      QuizResult.find()
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .limit(10),
      InterviewSession.find()
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .limit(10),
      Question.find().sort({ createdAt: -1, _id: -1 }).limit(12),
      Skill.find().sort({ updatedAt: -1, _id: -1 }).limit(12),
      Company.find().sort({ updatedAt: -1, _id: -1 }).limit(12),
    ]);

    const fullUsers = await User.find().select("name role badges activityLog");
    const allResults = await QuizResult.find().populate("userId", "name email");
    const allInterviews = await InterviewSession.find().populate("userId", "name email");

    const quizPercentages = allResults.map((item) =>
      item.total ? Math.round((item.score / item.total) * 100) : 0,
    );
    const interviewScores = allInterviews.map((item) => Math.round(item.overallScore || 0));
    const averageQuizScore = quizPercentages.length
      ? Math.round(quizPercentages.reduce((sum, item) => sum + item, 0) / quizPercentages.length)
      : 0;
    const averageInterviewScore = interviewScores.length
      ? Math.round(interviewScores.reduce((sum, item) => sum + item, 0) / interviewScores.length)
      : 0;
    const combinedAverage = allResults.length || allInterviews.length
      ? Math.round(averageQuizScore * 0.65 + averageInterviewScore * 0.35)
      : 0;

    const latestResultsByUser = new Map();
    allResults
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach((item) => {
        const key = String(item.userId?._id || item.userId);
        if (!latestResultsByUser.has(key)) {
          latestResultsByUser.set(key, item);
        }
      });

    const jobReadyStudents = [...latestResultsByUser.values()].filter((item) => {
      const readiness = item.report?.readinessScore || (item.total ? Math.round((item.score / item.total) * 100) : 0);
      return readiness >= 90;
    }).length;

    const engagementLeaders = fullUsers
      .filter((item) => item.role === "student")
      .map((item) => {
        const summary = buildActivitySummary(item.activityLog || []);
        return {
          id: item._id,
          name: item.name,
          currentStreak: summary.currentStreak,
          longestStreak: summary.longestStreak,
          activeDays: summary.totalActiveDays,
          badges: item.badges || [],
        };
      })
      .sort((a, b) => b.currentStreak - a.currentStreak || b.activeDays - a.activeDays)
      .slice(0, 8);

    res.json({
      stats: {
        userCount,
        questionCount,
        resultCount,
        skillCount,
        companyCount,
        interviewCount,
      },
      analytics: {
        averageQuizScore,
        averageInterviewScore,
        combinedAverage,
        jobReadyStudents,
        engagementLeaders,
      },
      users,
      results,
      interviews,
      questions,
      skills,
      companies,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createAdminUser = async (req, res) => {
  try {
    const payload = buildAdminUserPayload(req.body);
    const validationMessage = validateAdminUserPayload(payload);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const existingUser = await User.findOne({ email: payload.email });
    if (existingUser) {
      return res.status(400).json({ message: "A user with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    const adminUser = await User.create({
      name: payload.name,
      email: payload.email,
      password: hashedPassword,
      role: "admin",
    });

    res.status(201).json({
      message: "Admin account created successfully",
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const questions = await Question.find().sort({ createdAt: -1, _id: -1 });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const payload = buildQuestionPayload(req.body);
    const validationMessage = validateQuestionPayload(payload);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const question = await Question.create(payload);
    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const payload = buildQuestionPayload(req.body);
    const validationMessage = validateQuestionPayload(payload);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const question = await Question.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findByIdAndDelete(req.params.id);

    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSkills = async (req, res) => {
  try {
    const skills = await Skill.find().sort({ name: 1 });
    res.json(skills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSkill = async (req, res) => {
  try {
    const payload = buildSkillPayload(req.body);
    const validationMessage = validateSkillPayload(payload);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const skill = await Skill.create(payload);
    res.status(201).json(skill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSkill = async (req, res) => {
  try {
    const payload = buildSkillPayload(req.body);
    const validationMessage = validateSkillPayload(payload);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const skill = await Skill.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    res.json(skill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteSkill = async (req, res) => {
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id);

    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }

    res.json({ message: "Skill deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCompanies = async (req, res) => {
  try {
    await ensureDefaultCompanies();

    const companies = await Company.find().sort({ name: 1 });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCompany = async (req, res) => {
  try {
    const payload = buildCompanyPayload(req.body);
    const validationMessage = validateCompanyPayload(payload);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const company = await Company.create(payload);
    res.status(201).json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCompany = async (req, res) => {
  try {
    const payload = buildCompanyPayload(req.body);
    const validationMessage = validateCompanyPayload(payload);

    if (validationMessage) {
      return res.status(400).json({ message: validationMessage });
    }

    const company = await Company.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    });

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const company = await Company.findByIdAndDelete(req.params.id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json({ message: "Company deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
