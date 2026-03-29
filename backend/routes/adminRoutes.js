const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");
const { getOverview, createQuestion } = require("../controllers/adminController");

router.get("/overview", auth, adminOnly, getOverview);
router.post("/questions", auth, adminOnly, createQuestion);

module.exports = router;
