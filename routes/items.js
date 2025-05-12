const express = require("express");
const { v4: uuidv4 } = require("uuid");
const List = require("../models/List");
const Item = require("../models/Item");
const authenticateToken = require("../middleware/auth");

const router = express.Router();

// Добавление товара
router.post("/:listId", authenticateToken, async (req, res) => {
    try {
      const { listId } = req.params;
      const { name } = req.body;
      console.log("Adding item to list:", listId, "Item name:", name); // Отладка
      if (!name) {
        return res.status(400).json({ error: "Название элемента обязательно" });
      }
      const list = await List.findById(listId);
      if (!list) {
        return res.status(404).json({ error: "Список не найден" });
      }
      if (!list.members.some((m) => m.userId.toString() === req.user._id.toString())) {
        return res.status(403).json({ error: "Вы не участник списка" });
      }
      list.items.push({ name, addedBy: req.user._id });
      await list.save();
      req.io.to(listId).emit("listUpdated", { members: list.members, items: list.items, name: list.name });
      res.json({ items: list.items });
    } catch (error) {
      console.error("Error adding item:", error);
      res.status(500).json({ error: "Ошибка сервера", details: error.message });
    }
  });

// Обновление товара
router.patch("/:id/items/:itemId", authenticateToken, async (req, res) => {
  const { id, itemId } = req.params;
  const { purchased } = req.body;
  if (typeof purchased !== "boolean") {
    return res.status(400).json({ error: "Неверный формат purchased" });
  }
  try {
    const list = await List.findOne({ id, userIds: req.user._id });
    if (!list) {
      return res.status(403).json({ error: "Список не найден или доступ запрещён" });
    }
    const item = await Item.findOneAndUpdate(
      { id: itemId, listId: id },
      { purchased },
      { new: true }
    );
    if (!item) {
      return res.status(404).json({ error: "Товар не найден" });
    }
    res.io.to(id).emit("item_updated", { id: itemId, purchased });
    res.json({ id: itemId, purchased });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Удаление товара
router.delete("/:id/items/:itemId", authenticateToken, async (req, res) => {
  const { id, itemId } = req.params;
  try {
    const list = await List.findOne({ id, userIds: req.user._id });
    if (!list) {
      return res.status(403).json({ error: "Список не найден или доступ запрещён" });
    }
    const item = await Item.findOneAndDelete({ id: itemId, listId: id });
    if (!item) {
      return res.status(404).json({ error: "Товар не найден" });
    }
    res.io.to(id).emit("item_deleted", itemId);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;