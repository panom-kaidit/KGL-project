const mongoose = require("mongoose");

const procurementSchema = new mongoose.Schema({
  produceName: { type: String, required: true},
  produceType:{ type: String, required:true},
  date:{type: String, required: true},
  time: { type: String, required: true },
  tonnage: { type: Number, required: true },
  cost: { type: Number, required: true },
  dealerName: { type: String, required: true },
  branch: { type: String, enum: ["Maganjo", "Matugga"] },
  contact: { type: String, required: true },
  sellingPrice: {type: Number,required:true},
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
});

module.exports = mongoose.model("Procurement", procurementSchema);