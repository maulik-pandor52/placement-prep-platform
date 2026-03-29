const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const {
  getOverview,
  getQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
} = require("../controllers/adminController");

router.get("/overview", auth, adminOnly, getOverview);
router.get("/questions", auth, adminOnly, getQuestions);
router.post("/questions", auth, adminOnly, createQuestion);
router.put("/questions/:id", auth, adminOnly, updateQuestion);
router.delete("/questions/:id", auth, adminOnly, deleteQuestion);
router.get("/skills", auth, adminOnly, getSkills);
router.post("/skills", auth, adminOnly, createSkill);
router.put("/skills/:id", auth, adminOnly, updateSkill);
router.delete("/skills/:id", auth, adminOnly, deleteSkill);
router.get("/companies", auth, adminOnly, getCompanies);
router.post("/companies", auth, adminOnly, createCompany);
router.put("/companies/:id", auth, adminOnly, updateCompany);
router.delete("/companies/:id", auth, adminOnly, deleteCompany);

module.exports = router;
