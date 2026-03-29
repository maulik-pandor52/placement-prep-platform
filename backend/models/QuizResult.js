const mongoose = require("mongoose");

const areaSummarySchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    correct: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

const companySuggestionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    matchReason: {
      type: String,
      required: true,
      trim: true,
    },
    focusAreas: {
      type: [String],
      default: [],
    },
  },
  { _id: false },
);

const quizResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  score: {
    type: Number,
    required: true,
  },

  total: {
    type: Number,
    required: true,
  },

  testType: {
    type: String,
    enum: ["initial", "company"],
    default: "initial",
  },

  company: {
    type: String,
    default: "",
    trim: true,
  },

  report: {
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    tips: {
      type: [String],
      default: [],
    },
    skillBreakdown: {
      type: [areaSummarySchema],
      default: [],
    },
    categoryBreakdown: {
      type: [areaSummarySchema],
      default: [],
    },
    companySuggestions: {
      type: [companySuggestionSchema],
      default: [],
    },
    pointsEarned: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    badgesEarned: {
      type: [String],
      default: [],
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("QuizResult", quizResultSchema);
