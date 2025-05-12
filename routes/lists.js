const express = require("express");
const router = express.Router();
const List = require("../models/List");
const authenticateToken = require("../middleware/auth");

// Создание списка
router.post("/", authenticateToken, async (req, res) => {
  try {
    console.log("Creating list for user:", req.user._id);
    const list = new List({
      name: req.body.name || "Новый список",
      owner: req.user._id,
      members: [{ userId: req.user._id, email: req.user.email, joinedAt: new Date() }],
    });
    await list.save();
    res.json({ listId: list._id });
  } catch (error) {
    console.error("Error creating list:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Получение всех списков пользователя
router.get("/", authenticateToken, async (req, res) => {
  try {
    const lists = await List.find({
      $or: [{ owner: req.user._id }, { "members.userId": req.user._id }],
    });
    res.json(lists);
  } catch (error) {
    console.error("Error fetching lists:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Присоединение к списку
router.post("/join/:listId", authenticateToken, async (req, res) => {
  try {
    const { listId } = req.params;
    console.log("Joining list:", listId, "User:", req.user._id);
    const list = await List.findById(listId);
    if (!list) return res.status(404).json({ error: "Список не найден" });
    if (list.members.some((m) => m.userId.toString() === req.user._id.toString())) {
      console.log("User already in list:", req.user._id);
      return res.status(400).json({ error: "Вы уже в списке" });
    }
    list.members.push({ userId: req.user._id, email: req.user.email, joinedAt: new Date() });
    await list.save();
    console.log("Emitting listUpdated to list:", listId);
    req.io.to(listId).emit("listUpdated", { members: list.members, items: list.items, name: list.name });
    res.json({ message: "Вы присоединились к списку" });
  } catch (error) {
    console.error("Error joining list:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Добавление элемента
router.post("/items/:listId", authenticateToken, async (req, res) => {
  try {
    const { listId } = req.params;
    const { name } = req.body;
    console.log("Adding item to list:", listId, "with name:", name);
    if (!name) {
      console.log("Item name is missing");
      return res.status(400).json({ error: "Название товара обязательно" });
    }
    const list = await List.findById(listId);
    if (!list) {
      console.log("List not found:", listId);
      return res.status(404).json({ error: "Список не найден" });
    }
    if (!list.members.some((m) => m.userId.toString() === req.user._id.toString())) {
      console.log("User not a member:", req.user._id);
      return res.status(403).json({ error: "Вы не участник этого списка" });
    }
    list.items.push({ name, completed: false });
    await list.save();
    console.log("Emitting listUpdated to list:", listId);
    req.io.to(listId).emit("listUpdated", { items: list.items });
    res.json({ items: list.items });
  } catch (error) {
    console.error("Error adding item:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Обновление статуса элемента (completed)
router.put("/items/:itemId/complete", authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { completed } = req.body;
    console.log("Updating item:", itemId, "to completed:", completed);
    const list = await List.findOne({ "items._id": itemId }).populate("members.userId", "email");
    if (!list) return res.status(404).json({ error: "Список или элемент не найден" });
    if (!list.members.some((m) => m.userId._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: "Вы не участник этого списка" });
    }
    const item = list.items.id(itemId);
    if (!item) return res.status(404).json({ error: "Элемент не найден" });
    item.completed = completed;
    await list.save();
    console.log("Emitting listUpdated to list:", list._id);
    req.io.to(list._id).emit("listUpdated", { items: list.items });
    res.json({ items: list.items });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Удаление отмеченных элементов
router.delete("/:listId/items/completed", authenticateToken, async (req, res) => {
  try {
    const { listId } = req.params;
    console.log("Received DELETE /lists/", listId, "/items/completed for user:", req.user._id);
    const list = await List.findById(listId);
    if (!list) {
      console.log("List not found:", listId);
      return res.status(404).json({ error: "Список не найден" });
    }
    console.log("Found list:", listId);
    if (!list.members.some((m) => m.userId.toString() === req.user._id.toString())) {
      console.log("User not a member:", req.user._id);
      return res.status(403).json({ error: "Вы не участник этого списка" });
    }
    const initialItemCount = list.items.length;
    list.items = list.items.filter((item) => !item.completed);
    const removedCount = initialItemCount - list.items.length;
    console.log("Removed", removedCount, "completed items from list:", listId);
    await list.save();
    console.log("Emitting listUpdated to list:", listId);
    req.io.to(listId).emit("listUpdated", { items: list.items, members: list.members });
    res.json({ items: list.items });
  } catch (error) {
    console.error("Error deleting completed items:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Получение списка по ID
router.get("/:listId", authenticateToken, async (req, res) => {
  try {
    const list = await List.findById(req.params.listId);
    if (!list) return res.status(404).json({ error: "Список не найден" });
    if (!list.members.some((m) => m.userId.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: "Вы не участник этого списка" });
    }
    res.json({
      items: list.items,
      members: list.members,
      owner: list.owner,
      ownerEmail: list.members.find((m) => m.userId.toString() === list.owner.toString())?.email,
      name: list.name,
      currentUserId: req.user._id,
    });
  } catch (error) {
    console.error("Error fetching list:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Обновление названия списка
router.put("/:listId", authenticateToken, async (req, res) => {
  try {
    const list = await List.findById(req.params.listId);
    if (!list) return res.status(404).json({ error: "Список не найден" });
    if (list.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Только владелец может редактировать список" });
    }
    list.name = req.body.name || list.name;
    await list.save();
    req.io.to(req.params.listId).emit("listUpdated", {
      items: list.items,
      members: list.members,
      name: list.name,
    });
    res.json({ message: "Список обновлён" });
  } catch (error) {
    console.error("Error updating list:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Удаление участника
router.delete("/:listId/members/:userId", authenticateToken, async (req, res) => {
  try {
    const { listId, userId } = req.params;
    console.log("Removing member:", userId, "from list:", listId);
    const list = await List.findById(listId);
    if (!list) return res.status(404).json({ error: "Список не найден" });
    if (list.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Только владелец может удалять участников" });
    }
    if (userId === req.user._id.toString()) {
      return res.status(400).json({ error: "Владелец не может удалить себя" });
    }
    list.members = list.members.filter((m) => m.userId.toString() !== userId);
    await list.save();
    console.log("Emitting listUpdated to list:", listId);
    req.io.to(listId).emit("listUpdated", { members: list.members, items: list.items });
    console.log("Emitting kickedFromList to user:", userId);
    req.io.to(userId).emit("kickedFromList", { listId, name: list.name });
    res.json({ message: "Участник удалён" });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Выход из списка
router.post("/:listId/leave", authenticateToken, async (req, res) => {
  try {
    const { listId } = req.params;
    const userId = req.user._id.toString();
    console.log("User leaving list:", userId, "from list:", listId);
    const list = await List.findById(listId);
    if (!list) return res.status(404).json({ error: "Список не найден" });
    if (list.owner.toString() === userId) {
      return res.status(400).json({ error: "Владелец не может покинуть свой список" });
    }
    if (!list.members.some((m) => m.userId.toString() === userId)) {
      return res.status(400).json({ error: "Вы не участник этого списка" });
    }
    list.members = list.members.filter((m) => m.userId.toString() !== userId);
    await list.save();
    console.log("Emitting listUpdated to list:", listId);
    req.io.to(listId).emit("listUpdated", { members: list.members, items: list.items });
    console.log("Emitting kickedFromList to user:", userId);
    req.io.to(userId).emit("kickedFromList", { listId, name: list.name });
    res.json({ message: "Вы покинули список" });
  } catch (error) {
    console.error("Error leaving list:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// Удаление списка
router.delete("/:listId", authenticateToken, async (req, res) => {
  try {
    const list = await List.findById(req.params.listId);
    if (!list) return res.status(404).json({ error: "Список не найден" });
    if (list.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Только владелец может удалить список" });
    }
    await list.deleteOne();
    res.json({ message: "Список удалён" });
  } catch (error) {
    console.error("Error deleting list:", error);
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

module.exports = router;