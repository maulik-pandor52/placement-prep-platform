const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");

const {
  getQuestions,
  saveResult,
  getResults,
  getLeaderboard,
  getSkillTracker,
} = require("../controllers/quizController");

router.get("/questions", auth, getQuestions);
router.post("/result", auth, saveResult);
router.get("/results", auth, getResults);
router.get("/leaderboard", auth, getLeaderboard);
router.get("/skill-tracker", auth, getSkillTracker);

module.exports = router;
