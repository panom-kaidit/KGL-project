const mongoose = require("mongoose");
const Sale     = require("../models/sales");
const User     = require("../models/User");

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

// FIXED (SECURITY-05): Previously, if a Manager had no branch, this returned {}
// (empty filter) meaning the Manager could see ALL credit sales from all branches.
// Now we return a filter that matches nothing, and surface a 400 to the caller.
async function buildScopeFilter(user) {
  if (user.role === "Sales-agent") {
    return { recordedBy: new mongoose.Types.ObjectId(user.id) };
  }

  if (user.role === "Manager") {
    if (!user.branch) {
      // Return a filter that matches no document instead of leaking all data
      return { _id: new mongoose.Types.ObjectId("000000000000000000000000") };
    }
    // FIXED: Uses sale.branch directly (new field) — no longer does
    // indirect lookup via agent IDs which breaks on agent reassignment/deletion
    return { branch: user.branch };
  }

  // Director sees everything
  return {};
}

// ── GET /credits ──────────────────────────────────────────────────────────────
exports.getCreditSales = async (req, res) => {
  try {
    if (req.user.role === "Manager" && !req.user.branch) {
      return res.status(400).json({ message: "Your account has no branch assigned." });
    }

    const scopeFilter = await buildScopeFilter(req.user);

    const credits = await Sale.find({
      saleType: "credit",
      status:   { $in: ["pending", "partial"] },
      ...scopeFilter
    })
      .populate("recordedBy", "name")
      .sort({ dueDate: 1 })
      .lean();

    return res.status(200).json({ count: credits.length, data: credits });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ── GET /credits/all ──────────────────────────────────────────────────────────
exports.getAllCreditSales = async (req, res) => {
  try {
    if (req.user.role === "Manager" && !req.user.branch) {
      return res.status(400).json({ message: "Your account has no branch assigned." });
    }

    const scopeFilter = await buildScopeFilter(req.user);

    const credits = await Sale.find({ saleType: "credit", ...scopeFilter })
      .populate("recordedBy", "name")
      .sort({ date: -1 })
      .lean();

    return res.status(200).json({ count: credits.length, data: credits });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ── GET /credits/:id ──────────────────────────────────────────────────────────
exports.getCreditSaleById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid sale ID" });
    }

    const sale = await Sale.findOne({ _id: id, saleType: "credit" })
      .populate("recordedBy", "name")
      .lean();

    if (!sale) {
      return res.status(404).json({ message: "Credit sale not found" });
    }

    return res.status(200).json({ data: sale });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};

// ── PATCH /credits/:id/pay — process a payment (atomic) ──────────────────────
exports.makePayment = async (req, res) => {
  try {
    const { id }           = req.params;
    const { paymentAmount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid sale ID" });
    }

    const amount = Number(paymentAmount);
    if (!paymentAmount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Payment amount must be greater than 0" });
    }

    const roundedAmount = Math.round(amount * 100) / 100;

    // FIXED (LOGIC-06 — race condition): Previously this was a read-then-write
    // pattern: fetch sale → compute new balance → update. Two simultaneous
    // requests could both pass the balance check and both deduct, causing
    // over-deduction beyond the original amountDue.
    //
    // FIX: Use a single atomic findOneAndUpdate with an aggregation pipeline
    // (MongoDB 4.2+). The filter condition `amountDue: { $gte: roundedAmount }`
    // acts as an atomic guard — MongoDB checks AND updates in one operation.
    // If the condition fails, no update occurs and null is returned.
    const updated = await Sale.findOneAndUpdate(
      {
        _id:      id,
        saleType: "credit",
        status:   { $in: ["pending", "partial"] },
        amountDue: { $gte: roundedAmount }  // atomic overpayment guard
      },
      [
        // Aggregation pipeline update — computes new values atomically
        {
          $set: {
            amountDue: { $subtract: ["$amountDue", roundedAmount] }
          }
        },
        {
          $set: {
            // Determine new status based on the updated amountDue
            status: {
              $cond: {
                if:   { $lte: ["$amountDue", 0] },
                then: "paid",
                else: "partial"
              }
            },
            paymentHistory: {
              $concatArrays: [
                "$paymentHistory",
                [{
                  amount:     roundedAmount,
                  date:       todayStr(),
                  recordedBy: new mongoose.Types.ObjectId(req.user.id)
                }]
              ]
            }
          }
        }
      ],
      // Use returnDocument:'after' to return the updated document (replaces new:true).
      { returnDocument: "after", runValidators: true }
    ).lean();

    if (!updated) {
      // The atomic update failed — determine the specific reason
      const sale = await Sale.findById(id).lean();
      if (!sale)                         return res.status(404).json({ message: "Credit sale not found" });
      if (sale.saleType !== "credit")    return res.status(400).json({ message: "This record is not a credit sale" });
      if (sale.status   === "paid")      return res.status(400).json({ message: "This credit sale is already fully paid" });
      if ((sale.amountDue || 0) <= 0)   return res.status(400).json({ message: "This credit sale is already fully paid" });

      return res.status(400).json({
        message:   `Payment of ${roundedAmount} exceeds remaining balance of ${sale.amountDue}. Overpayment is not allowed.`,
        amountDue: sale.amountDue
      });
    }

    const message = updated.status === "paid"
      ? "Payment successful. Credit sale has been fully settled."
      : `Payment of ${roundedAmount} received. Remaining balance: ${updated.amountDue}`;

    return res.status(200).json({
      message,
      status:    updated.status,
      amountDue: updated.amountDue,
      data:      updated
    });

  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
};
