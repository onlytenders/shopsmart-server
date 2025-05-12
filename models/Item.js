const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    id: { type: String, required: true },
    listId: { type: String, required: true },
    name: { type: String, required: true },
    purchased: { type: Boolean, default: false },
  });

module.exports = mongoose.model("Item", itemSchema);