const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "789789";

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Register request for email:", email);
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists:", email);
      return res.status(400).json({ error: "Пользователь уже существует" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
    console.log("User registered, token generated for userId:", user._id);
    res.json({ token, userId: user._id });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login request for email:", email);
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ error: "Неверный email или пароль" });
    }
    console.log("Found user:", user._id, "comparing passwords...");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Invalid password for email:", email);
      return res.status(400).json({ error: "Неверный email или пароль" });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
    console.log("Login successful, token generated for userId:", user._id);
    res.json({ token, userId: user._id });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Verify token
router.get("/verify", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      console.log("No token provided for verify");
      return res.status(401).json({ error: "Токен не предоставлен" });
    }
    console.log("Verifying token for user...");
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log("Token verified, userId:", decoded.userId);
    res.json({ userId: decoded.userId });
  } catch (error) {
    console.error("Verify error:", error);
    res.status(401).json({ error: "Недействительный токен" });
  }
});

module.exports = router;