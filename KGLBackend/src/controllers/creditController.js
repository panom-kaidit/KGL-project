const mongoose = require("mongoose");
const Sale = require("../models/sales");
const User = require("../models/User");

// ── Helpers ────────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Build the recordedBy filter based on the caller's role:
 *   Sales-agent → only their own credit sales
 *   Manager     → all credit sales in their branch
 *   Director    → all credit sales (no filter)
 */
async function buildScopeFilter(user) {
  if (user.role === "Sales-agent") {
    return { recordedBy: new mongoose.Types.ObjectId(user.id) };
  }

  if (user.role === "Manager") {
    if (!user.branch) return {};
    const agents = await User.find({ branch: user.branch }).select("_id").lean();
    return { recordedBy: { $in: agents.map((a) => a._id) } };
  }

  // Director or any other privileged role sees everything
  return {};
}

// ── GET /credits — list all active (pending / partial) credit sales ────────────
exports.getCreditSales = async (req, res) => {
  try {
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
    return res.status(500).json({ error: error.message });
  }
};

// ── GET /credits/all — list ALL credit sales including paid (audit view) ───────
exports.getAllCreditSales = async (req, res) => {
  try {
    const scopeFilter = await buildScopeFilter(req.user);

    const credits = await Sale.find({ saleType: "credit", ...scopeFilter })
      .populate("recordedBy", "name")
      .sort({ date: -1 })
      .lean();

    return res.status(200).json({ count: credits.length, data: credits });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// ── GET /credits/:id — single credit sale detail ──────────────────────────────
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
    return res.status(500).json({ error: error.message });
  }
};

// ── PATCH /credits/:id/pay — process a payment ────────────────────────────────
/**
 * Business rules:
 *  1. Sale must exist and be a credit type.
 *  2. Sale must not already be fully paid.
 *  3. paymentAmount must be a positive number.
 *  4. paymentAmount must NOT exceed remaining amountDue (no overpayment).
 *  5. After deducting, if amountDue reaches 0 → status = "paid".
 *     Otherwise → status = "partial".
 *  6. Every payment is appended to paymentHistory (audit log).
 *  7. The record is NEVER deleted — soft-close via status="paid".
 */
exports.makePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentAmount } = req.body;

    // ── 1. Validate MongoDB ObjectId ──────────────────────────────────────────
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid sale ID" });
    }

    // ── 2. Validate payment amount ────────────────────────────────────────────
    const amount = Number(paymentAmount);
    if (!paymentAmount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Payment amount must be greater than 0" });
    }

    // Round to 2 decimal places to avoid floating-point drift
    const roundedAmount = Math.round(amount * 100) / 100;

    // ── 3. Fetch the sale ─────────────────────────────────────────────────────
    const sale = await Sale.findById(id);
    if (!sale) {
      return res.status(404).json({ message: "Credit sale not found" });
    }

    // ── 4. Ensure it's actually a credit sale ─────────────────────────────────
    if (sale.saleType !== "credit") {
      return res.status(400).json({ message: "This record is not a credit sale" });
    }

    // ── 5. Guard: already fully paid ─────────────────────────────────────────
    if (sale.status === "paid" || sale.amountDue <= 0) {
      return res.status(400).json({ message: "This credit sale is already fully paid" });
    }

    // ── 6. Guard: no overpayment ──────────────────────────────────────────────
    if (roundedAmount > sale.amountDue) {
      return res.status(400).json({
        message: `Payment of ${roundedAmount} exceeds remaining balance of ${sale.amountDue}. Overpayment is not allowed.`,
        amountDue: sale.amountDue
      });
    }

    // ── 7. Compute new balance and status ─────────────────────────────────────
    const newAmountDue = Math.round((sale.amountDue - roundedAmount) * 100) / 100;
    const newStatus    = newAmountDue === 0 ? "paid" : "partial";

    // ── 8. Atomic update (findByIdAndUpdate keeps the operation thread-safe) ──
    const updated = await Sale.findByIdAndUpdate(
      id,
      {
        $set:  { amountDue: newAmountDue, status: newStatus },
        $push: {
          paymentHistory: {
            amount:     roundedAmount,
            date:       todayStr(),
            recordedBy: req.user.id
          }
        }
      },
      { new: true, runValidators: true }
    ).lean();

    // ── 9. Build response ─────────────────────────────────────────────────────
    const message =
      newStatus === "paid"
        ? "Payment successful. Credit sale has been fully settled."
        : `Payment of ${roundedAmount} received. Remaining balance: ${newAmountDue}`;

    return res.status(200).json({
      message,
      status:    newStatus,
      amountDue: newAmountDue,
      data:      updated
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
