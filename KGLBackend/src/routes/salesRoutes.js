const express = require("express");
const authMiddleware = require("../middlewares/authMiddleware");
const authRole = require("../middlewares/rbaMiddleware");
const Sale = require("../models/sales");
const router = express.Router();
router.post(
  "/",
  authMiddleware,
  authRole("Sales-agent"),
  async (req, res) => {
    try {
      const {
        saleType,
        produceName,
        produceType,
        tonnage,
        amountPaid,
        buyerName,
        salesAgentName,
        date,
        time,
        nationalId,
        location,
        contacts,
        amountDue,
        dueDate,
        dispatchDate
      } = req.body;

      // Basic checks
      if (!["cash", "credit"].includes(saleType))
        return res.status(400).json({ message: "Invalid sale type" });

      if (!produceName || tonnage < 1)
        return res.status(400).json({ message: "Produce name and valid tonnage required" });

      // CASH SALE VALIDATION
      if (saleType === "cash") {
        if (!amountPaid || amountPaid < 10000)
          return res.status(400).json({ message: "Amount paid must be at least 5 digits" });

        if (!buyerName || buyerName.length < 2)
          return res.status(400).json({ message: "Buyer name too short" });

        if (!salesAgentName || salesAgentName.length < 2)
          return res.status(400).json({ message: "Sales agent name too short" });

        if (!date || !time)
          return res.status(400).json({ message: "Date and time required" });
      }

      // CREDIT SALE VALIDATION
      if (saleType === "credit") {
        if (!/^[A-Z0-9]{8,}$/.test(nationalId))
          return res.status(400).json({ message: "Invalid NIN format" });

        if (!location || location.length < 2)
          return res.status(400).json({ message: "Location required" });

        if (!/^\+?\d{10,13}$/.test(contacts))
          return res.status(400).json({ message: "Invalid phone number" });

        if (!amountDue || amountDue < 10000)
          return res.status(400).json({ message: "Amount due must be at least 5 digits" });

        if (!dueDate || !dispatchDate)
          return res.status(400).json({ message: "Due date and dispatch date required" });
      }

      const sale = new Sale({
        saleType,
        produceName,
        produceType,
        tonnage,
        amountPaid,
        buyerName,
        salesAgent: salesAgentName,
        date,
        time,
        NationalID: nationalId,
        location,
        contact: contacts,
        amountDue,
        dueDate,
        dispatchDate
      });
      await sale.save();

      res.status(201).json({ message: "Sale recorded successfully" });

    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;

module.exports = router;