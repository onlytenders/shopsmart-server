const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// Регистрация
router.post("/register", async (req, res) => {
    try {
      const { email, password } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Пользователь уже существует" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ email, password: hashedPassword });
      await user.save();
      res.status(201).json({ message: "Пользователь зарегистрирован" });
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });
  
  // Вход
  router.post("/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: "Неверный email или пароль" });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Неверный email или пароль" });
      }
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "789789", {
        expiresIn: "1h",
      });
      res.json({ token, userId: user._id }); // Возвращаем userId
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ error: "Ошибка сервера" });
    }
  });
  
  // Получение email текущего пользователя
  router.get("/email/me", async (req, res) => {
    try {
      const token = req.headers["authorization"]?.split(" ")[1];
      if (!token) {
        return res.status(401).json({ error: "Токен не предоставлен" });
      }
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "789789");
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({ error: "Пользователь не найден" });
      }
      res.json({ email: user.email });
    } catch (error) {
      console.error("Error fetching user email:", error);
      res.status(401).json({ error: "Неверный токен" });
    }
  });

// Получение пользователя по email
router.get("/email/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Получение пользователя по ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    res.json({ email: user.email });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;