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
    responseSeconds: {
      type: Number,
      default: 0,
    },
    usedCamera: {
      type: Boolean,
      default: false,
    },
    videoDurationSeconds: {
      type: Number,
      default: 0,
    },
    deliveryScore: {
      type: Number,
      default: 0,
    },
    videoUrl: {
      type: String,
      default: "",
      trim: true,
    },
    confidenceScore: {
      type: Number,
      default: 0,
    },
    confusionScore: {
      type: Number,
      default: 0,
    },
    expressionSummary: {
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
  interviewMode: {
    type: String,
    enum: ["text", "video"],
    default: "text",
  },
  overallScore: {
    type: Number,
    default: 0,
  },
  contentScore: {
    type: Number,
    default: 0,
  },
  deliveryScore: {
    type: Number,
    default: 0,
  },
  confidenceScore: {
    type: Number,
    default: 0,
  },
  confusionScore: {
    type: Number,
    default: 0,
  },
  expressionSummary: {
    type: String,
    default: "",
    trim: true,
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
  videoSummary: {
    cameraEnabled: {
      type: Boolean,
      default: false,
    },
    recordingsCount: {
      type: Number,
      default: 0,
    },
    totalRecordedSeconds: {
      type: Number,
      default: 0,
    },
  },
  facialInsights: {
    faceTrackingSupported: {
      type: Boolean,
      default: false,
    },
    averageConfidence: {
      type: Number,
      default: 0,
    },
    averageConfusion: {
      type: Number,
      default: 0,
    },
    summary: {
      type: String,
      default: "",
      trim: true,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("InterviewSession", interviewSessionSchema);
