const User = require("../models/User");
const Question = require("../models/Question");
const QuizResult = require("../models/QuizResult");

exports.getOverview = async (req, res) => {
  try {
    const [userCount, questionCount, resultCount, users, results, questions] =
      await Promise.all([
        User.countDocuments(),
        Question.countDocuments(),
        QuizResult.countDocuments(),
        User.find()
          .select("name email role createdAt")
          .sort({ createdAt: -1 })
          .limit(8),
        QuizResult.find()
          .populate("userId", "name email")
          .sort({ createdAt: -1 })
          .limit(10),
        Question.find().sort({ createdAt: -1, _id: -1 }).limit(20),
      ]);

    res.json({
      stats: {
        userCount,
        questionCount,
        resultCount,
      },
      users,
      results,
      questions,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const {
      question,
      options,
      answer,
      skill,
      category,
      company = "",
    } = req.body;

    if (!question || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        message: "Question and at least two options are required",
      });
    }

    if (answer < 0 || answer >= options.length) {
      return res.status(400).json({
        message: "Answer must match one of the provided options",
      });
    }

    const newQuestion = await Question.create({
      question: question.trim(),
      options: options.map((item) => item.trim()).filter(Boolean),
      answer,
      skill: skill?.trim() || "General",
      category: category?.trim() || "General",
      company: company.trim(),
    });

    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
