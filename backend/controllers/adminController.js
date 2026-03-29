const User = require("../models/User");
const Question = require("../models/Question");
const QuizResult = require("../models/QuizResult");
const Skill = require("../models/Skill");
const Company = require("../models/Company");

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

  return { question, options, answer, skill, category, company };
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
});

const validateCompanyPayload = ({ name }) => {
  if (!name) {
    return "Company name is required";
  }

  return "";
};

exports.getOverview = async (req, res) => {
  try {
    const [
      userCount,
      questionCount,
      resultCount,
      skillCount,
      companyCount,
      users,
      results,
      questions,
      skills,
      companies,
    ] = await Promise.all([
      User.countDocuments(),
      Question.countDocuments(),
      QuizResult.countDocuments(),
      Skill.countDocuments(),
      Company.countDocuments(),
      User.find()
        .select("name email role createdAt")
        .sort({ createdAt: -1 })
        .limit(8),
      QuizResult.find()
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .limit(10),
      Question.find().sort({ createdAt: -1, _id: -1 }).limit(12),
      Skill.find().sort({ updatedAt: -1, _id: -1 }).limit(12),
      Company.find().sort({ updatedAt: -1, _id: -1 }).limit(12),
    ]);

    res.json({
      stats: {
        userCount,
        questionCount,
        resultCount,
        skillCount,
        companyCount,
      },
      users,
      results,
      questions,
      skills,
      companies,
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
