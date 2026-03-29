const mongoose = require("mongoose");

const requiredSkillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
    targetScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
  },
  { _id: false },
);

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    focusSkills: {
      type: [String],
      default: [],
    },
    preferredCategories: {
      type: [String],
      default: [],
    },
    industry: {
      type: String,
      default: "Technology",
      trim: true,
    },
    hiringFocus: {
      type: String,
      default: "",
      trim: true,
    },
    assessmentPattern: {
      type: [String],
      default: [],
    },
    requiredSkills: {
      type: [requiredSkillSchema],
      default: [],
    },
    benchmarkScore: {
      type: Number,
      default: 70,
      min: 0,
      max: 100,
    },
    difficultyLevel: {
      type: String,
      default: "medium",
      trim: true,
    },
    jobApiCountry: {
      type: String,
      default: "in",
      trim: true,
    },
    jobSearchTerms: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Company", companySchema);
