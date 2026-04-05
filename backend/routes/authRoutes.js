const express = require("express");
const router = express.Router();

const {
  register,
  login,
  registerAdmin,
  loginAdmin,
  getProfile,
} = require("../controllers/authController");
const auth = require("../middleware/authMiddleware");

router.post("/register", register);
router.post("/login", login);
router.post("/admin/register", registerAdmin);
router.post("/admin/login", loginAdmin);
router.get("/profile", auth, getProfile);

module.exports = router;
