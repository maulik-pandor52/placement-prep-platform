const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
  getInterviewQuestions,
  uploadInterviewClip,
  saveInterviewSession,
  getInterviewHistory,
} = require("../controllers/interviewController");

router.get("/questions", auth, getInterviewQuestions);
router.post("/upload", auth, express.raw({ type: "video/webm", limit: "50mb" }), uploadInterviewClip);
router.post("/sessions", auth, saveInterviewSession);
router.get("/history", auth, getInterviewHistory);

module.exports = router;
