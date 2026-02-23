const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema({
  saleType: { type: String, enum: ["cash", "credit"] },

  produceName: {type: String,required: true},
  produceType: String,
  tonnage: {type: Number,required: true},
  
// for cash sales
  amountPaid: Number,
  amountDue: Number,
  date: String,
  time: String,
// shared info
  buyerName: String,
  NationalID: String,
  location: String,
  contact: String,

  salesAgent: String,

  dueDate: String,
  dispatchDate: String,

  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model("Sale", saleSchema);