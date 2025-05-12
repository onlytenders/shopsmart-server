const mongoose = require("mongoose");

const listSchema = new mongoose.Schema({
  name: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [
    {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      email: { type: String, required: true },
      joinedAt: { type: Date, default: Date.now },
    },
  ],
  items: [
    {
      name: { type: String, required: true },
      completed: { type: Boolean, default: false }, // Новое поле
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    },
  ],
});

module.exports = mongoose.model("List", listSchema);