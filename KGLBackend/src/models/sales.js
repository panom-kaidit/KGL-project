const mongoose = require("mongoose");

const paymentEntrySchema = new mongoose.Schema(
  {
    amount:     { type: Number, required: true },
    date:       { type: String },                               // "YYYY-MM-DD"
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { _id: false }
);

const saleSchema = new mongoose.Schema({
  saleType: { type: String, enum: ["cash", "credit"] },

  produceName: { type: String, required: true },
  produceType:  String,
  tonnage:      { type: Number, required: true },

  // payment fields
  amountPaid: Number,
  amountDue:  Number,
  date:       String,
  time:       String,

  // shared info
  buyerName:  String,
  NationalID: String,
  location:   String,
  contact:    String,
  salesAgent: String,

  dueDate:      String,
  dispatchDate: String,

  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

  // ── Credit payment tracking ────────────────────────────────────────────────
  // "pending"  → no payments yet
  // "partial"  → at least one payment, still owes money
  // "paid"     → fully settled (soft record; stays in DB for audit trail)
  status: {
    type:    String,
    enum:    ["pending", "partial", "paid"],
    default: "pending"
  },

  // Immutable log of every payment received against this credit sale
  paymentHistory: { type: [paymentEntrySchema], default: [] }
});

module.exports = mongoose.model("Sale", saleSchema);