const mongoose = require("mongoose");

const procurementSchema = new mongoose.Schema({
  produceName: String,
  produceType: String,
  date: String,
  time: String,
  tonnage: Number,
  cost: Number,
  dealerName: String,
  branch: { type: String, enum: ["Maganjo", "Matugga"] },
  contact: String,
  sellingPrice: Number,
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model("Procurement", procurementSchema);