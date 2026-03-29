const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },

    options: {
      type: [String],
      required: true,
    },

    answer: {
      type: Number,
      required: true,
    },

    skill: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      trim: true,
    },

    company: {
      type: String,
      default: "",
      trim: true,
    },

    questionType: {
      type: String,
      default: "mcq",
      trim: true,
    },

    difficulty: {
      type: String,
      default: "medium",
      trim: true,
    },

    scenarioContext: {
      type: String,
      default: "",
      trim: true,
    },

    sourceLabel: {
      type: String,
      default: "",
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Question", questionSchema);
