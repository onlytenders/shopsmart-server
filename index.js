const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const socketIo = require("socket.io");
const http = require("http");

const usersRouter = require("./routes/users");
const listsRouter = require("./routes/lists");
const itemsRouter = require("./routes/items");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "https://shopsmart-client.vercel.app"],
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// Передача io в запросы
app.use((req, res, next) => {
  req.io = io;
  next();
});

mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/shopsmart", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/users", usersRouter);
app.use("/lists", listsRouter);
app.use("/items", itemsRouter);

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("joinList", (listId) => {
    console.log("User joined list:", listId, "Socket:", socket.id);
    socket.join(listId);
  });
  socket.on("joinUser", (userId) => {
    console.log("User joined user room:", userId, "Socket:", socket.id);
    socket.join(userId);
  });
  socket.on("updateList", ({ listId, items }) => {
    socket.to(listId).emit("listUpdated", { items });
  });
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));