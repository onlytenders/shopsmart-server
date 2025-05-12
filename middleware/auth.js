const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authenticateToken = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    console.log("No token provided"); // Отладка
    return res.status(401).json({ error: "Токен не предоставлен" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "789789");
    console.log("Decoded token:", decoded); // Отладка
    req.user = await User.findById(decoded.userId);
    if (!req.user) {
      console.log("User not found for ID:", decoded.userId); // Отладка
      return res.status(401).json({ error: "Пользователь не найден" });
    }
    next();
  } catch (error) {
    console.error("Token verification error:", error); // Отладка
    res.status(401).json({ error: "Неверный токен" });
  }
};

module.exports = authenticateToken;