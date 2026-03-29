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
    readinessScore: {
      type: Number,
      default: 0,
    },
    benchmarkGap: {
      type: Number,
      default: 0,
    },
    selectionChance: {
      type: Number,
      default: 0,
    },
    demandScore: {
      type: Number,
      default: 0,
    },
    nextMilestone: {
      type: String,
      default: "",
    },
  },
  { _id: false },
);

const gapInsightSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    currentScore: {
      type: Number,
      default: 0,
    },
    targetScore: {
      type: Number,
      default: 70,
    },
    gap: {
      type: Number,
      default: 0,
    },
    priority: {
      type: Number,
      default: 1,
    },
  },
  { _id: false },
);

const weakAreaSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      default: "skill",
    },
    percentage: {
      type: Number,
      default: 0,
    },
    severity: {
      type: String,
      default: "moderate",
    },
    reason: {
      type: String,
      default: "",
    },
    nextStep: {
      type: String,
      default: "",
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
    readinessScore: {
      type: Number,
      default: 0,
    },
    readinessLevel: {
      type: String,
      default: "Needs Work",
    },
    benchmarkScore: {
      type: Number,
      default: 0,
    },
    benchmarkGap: {
      type: Number,
      default: 0,
    },
    readinessSummary: {
      type: String,
      default: "",
    },
    improvementRoadmap: {
      type: [String],
      default: [],
    },
    categoryInsights: {
      type: [String],
      default: [],
    },
    skillGapAnalysis: {
      type: [gapInsightSchema],
      default: [],
    },
    weakAreaDetails: {
      type: [weakAreaSchema],
      default: [],
    },
    performanceBand: {
      type: String,
      default: "Developing",
    },
    performanceSummary: {
      type: String,
      default: "",
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("QuizResult", quizResultSchema);
