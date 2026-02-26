const express = require("express");

const authMiddleware = require("../middlewares/authMiddleware");
const authRole = require("../middlewares/rbaMiddleware");
const procurementController = require("../controllers/procurementController");
const router = express.Router();

// Create procurement record - Allow the manager to create procurements
router.post(
  "/",
  authMiddleware,
  authRole("Manager"),
  procurementController.createProcurement
);

// Get all procurement records
router.get(
  "/",
  authMiddleware,
  procurementController.getAllProcurement
);

// Get single procurement record
router.get(
  "/:id",
  authMiddleware,
  procurementController.getProcurementById
);

// Update procurement record
router.put(
  "/:id",
  authMiddleware,
  authRole("Manager"),
  procurementController.updateProcurement
);

// Delete procurement record
router.delete(
  "/:id",
  authMiddleware,
  authRole("Manager"),
  procurementController.deleteProcurement
);

module.exports = router;