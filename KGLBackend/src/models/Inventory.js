const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    itemName:       { type: String, required: true, trim: true },
    category:       { type: String, trim: true },
    stockKg:        { type: Number, required: true, default: 0 },
    costPerKg:      { type: Number, default: 0 },
    salePricePerKg: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Inventory", inventorySchema);
