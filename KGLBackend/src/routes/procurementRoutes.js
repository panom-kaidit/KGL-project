const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const authRole = require("../middlewares/rbaMiddleware");
const router = express.Router();

// lets allow the manager to access the procurements only
router.post("/",
  authMiddleware,
  authRole("Manager"),
  async (req, res) => {
  res.status(200).json({ message: "Procurement router working" });
});

module.exports = router;