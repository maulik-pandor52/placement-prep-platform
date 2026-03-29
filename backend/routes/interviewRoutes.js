const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
  getInterviewQuestions,
  saveInterviewSession,
  getInterviewHistory,
} = require("../controllers/interviewController");

router.get("/questions", auth, getInterviewQuestions);
router.post("/sessions", auth, saveInterviewSession);
router.get("/history", auth, getInterviewHistory);

module.exports = router;
