const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    dayKey: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["login", "quiz", "interview"],
      default: "login",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ["student", "admin"],
    default: "student",
  },

  points: {
    type: Number,
    default: 0,
  },

  badges: {
    type: [String],
    default: [],
  },

  totalQuizzes: {
    type: Number,
    default: 0,
  },

  activityLog: {
    type: [activitySchema],
    default: [],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", userSchema);
