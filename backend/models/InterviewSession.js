const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      default: "",
      trim: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    feedback: {
      type: String,
      default: "",
      trim: true,
    },
    topic: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false },
);

const interviewSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  company: {
    type: String,
    default: "",
    trim: true,
  },
  role: {
    type: String,
    default: "",
    trim: true,
  },
  skill: {
    type: String,
    default: "",
    trim: true,
  },
  overallScore: {
    type: Number,
    default: 0,
  },
  strengths: {
    type: [String],
    default: [],
  },
  improvements: {
    type: [String],
    default: [],
  },
  tips: {
    type: [String],
    default: [],
  },
  answers: {
    type: [answerSchema],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("InterviewSession", interviewSessionSchema);
