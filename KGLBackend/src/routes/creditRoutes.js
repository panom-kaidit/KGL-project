const express = require("express");
const router  = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const {
  getCreditSales,
  getAllCreditSales,
  getCreditSaleById,
  makePayment
} = require("../controllers/creditController");

/**
 * Credit-sale routes
 *
 * All routes require a valid JWT (authMiddleware).
 * Role-based scoping is handled inside each controller function.
 *
 * GET  /credits          → active credits (pending / partial) in caller's scope
 * GET  /credits/all      → all credits including paid (audit view)
 * GET  /credits/:id      → single credit sale detail
 * PATCH /credits/:id/pay → record a payment against a credit sale
 */

// List active credit sales
router.get("/", authMiddleware, getCreditSales);

// List ALL credit sales (including paid) — place before /:id to avoid conflict
router.get("/all", authMiddleware, getAllCreditSales);

// Single credit sale detail
router.get("/:id", authMiddleware, getCreditSaleById);

// Process a payment
router.patch("/:id/pay", authMiddleware, makePayment);

module.exports = router;
