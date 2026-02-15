const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema({
  saleType: { type: String, enum: ["cash", "credit"] },

  produceName: String,
  produceType: String,
  tonnage: Number,

  amountPaid: Number,
  amountDue: Number,

  buyerName: String,
  nin: String,
  location: String,
  contact: String,

  salesAgent: String,
  date: String,
  time: String,
  dueDate: String,
  dispatchDate: String,

  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model("Sale", saleSchema);