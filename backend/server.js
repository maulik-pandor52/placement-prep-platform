const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const quizRoutes = require("./routes/quizRoutes");

require("dotenv").config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/quiz", quizRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
