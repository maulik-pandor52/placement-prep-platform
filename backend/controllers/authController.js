const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { addActivityToUser, syncEngagementBadges } = require("../utils/activityTracker");

const resolveRole = (email) => {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.trim().toLowerCase()) ? "admin" : "student";
};

const buildAuthResponse = (user, role) => {
  const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  return {
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role,
    },
  };
};

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const resolvedRole = resolveRole(email);
    const genericRegistrationMessage = "Unable to create account with the provided details";

    if (resolvedRole === "admin") {
      return res.status(403).json({
        message: genericRegistrationMessage,
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: genericRegistrationMessage });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: resolvedRole,
    });

    addActivityToUser(user, "login");
    syncEngagementBadges(user);

    await user.save();

    res.json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, inviteCode } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const expectedInviteCode = (process.env.ADMIN_INVITE_CODE || "").trim();

    if (!expectedInviteCode || inviteCode?.trim() !== expectedInviteCode) {
      return res.status(403).json({
        message: "Invalid admin invite code",
      });
    }

    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "admin",
    });

    await user.save();

    res.status(201).json({
      message: "Admin registered successfully. Please sign in.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const invalidCredentialsMessage = "Invalid email or password";

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: invalidCredentialsMessage });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: invalidCredentialsMessage });
    }

    const role = user.role || resolveRole(user.email);

    if (role === "admin") {
      return res.status(400).json({ message: invalidCredentialsMessage });
    }

    if (!user.role) {
      user.role = role;
    }

    addActivityToUser(user, "login");
    syncEngagementBadges(user);
    await user.save();

    res.json(buildAuthResponse(user, role));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const role = user.role || resolveRole(user.email);

    if (role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    if (user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    res.json(buildAuthResponse(user, "admin"));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        points: user.points,
        badges: user.badges,
        totalQuizzes: user.totalQuizzes,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
