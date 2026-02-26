const Procurement = require("../models/procurement");

// Create procurement record
exports.createProcurement = async (req, res) => {
  try {
    const {
      supplier_name,
      supplier_contact,
      purchase_date,
      produce_time,
      invoice_number,
      product_name,
      product_category,
      quantity,
      unit_price,
      selling_price,
      branch,
      payment_method,
      payment_status
    } = req.body;

    // Basic validation rules
    const namePattern = /^[A-Za-z0-9 ]+$/;
    const typePattern = /^[A-Za-z ]{2,}$/;
    const dealerPattern = /^[A-Za-z0-9 ]{2,}$/;
    const phonePattern = /^[0-9+]{10,15}$/;

    if (!supplier_name || !dealerPattern.test(supplier_name)) {
      return res.status(400).json({ success: false, message: "Invalid supplier name" });
    }
    if (!supplier_contact || !phonePattern.test(supplier_contact)) {
      return res.status(400).json({ success: false, message: "Invalid supplier contact" });
    }
    if (!purchase_date) {
      return res.status(400).json({ success: false, message: "Purchase date required" });
    }
    if (!produce_time) {
      return res.status(400).json({ success: false, message: "Produce time required" });
    }
    if (!invoice_number) {
      return res.status(400).json({ success: false, message: "Invoice number required" });
    }
    if (!product_name || !namePattern.test(product_name)) {
      return res.status(400).json({ success: false, message: "Invalid product name" });
    }
    if (!product_category || !typePattern.test(product_category)) {
      return res.status(400).json({ success: false, message: "Invalid product category" });
    }
    if (!quantity || isNaN(quantity) || parseInt(quantity, 10) < 100) {
      return res.status(400).json({ success: false, message: "Quantity must be numeric and at least 3 digits" });
    }
    if (!unit_price || isNaN(unit_price) || parseFloat(unit_price) < 10000) {
      return res.status(400).json({ success: false, message: "Unit price must be numeric and at least 5 digits" });
    }
    if (!branch) {
      return res.status(400).json({ success: false, message: "Branch is required" });
    }

    // Calculate selling price if not provided
    let finalTotal = selling_price;
    if (!finalTotal || finalTotal === 0) {
      finalTotal = quantity * unit_price;
    }

    // Create new procurement record
    const newProcurement = new Procurement({
      produceName: product_name,
      produceType: product_category,
      date: purchase_date,
      time: produce_time,
      tonnage: quantity,
      cost: unit_price,
      dealerName: supplier_name,
      contact: supplier_contact,
      sellingPrice: finalTotal,
      branch: branch,
      recordedBy: req.user ? req.user.id : null,
      recordedByName: req.user ? req.user.name : ""
    });

    // Save to database
    const savedProcurement = await newProcurement.save();

    res.status(201).json({
      success: true,
      message: "Procurement record created successfully",
      data: savedProcurement
    });
  } catch (error) {
    console.error("Error creating procurement:", error);
    res.status(500).json({
      success: false,
      message: "Error creating procurement record",
      error: error.message
    });
  }
};

// Get all procurement records
exports.getAllProcurement = async (req, res) => {
  try {
    const procurements = await Procurement.find().populate("recordedBy", "name email");
    
    res.status(200).json({
      success: true,
      data: procurements
    });
  } catch (error) {
    console.error("Error fetching procurements:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching procurement records",
      error: error.message
    });
  }
};

// Get single procurement record by ID
exports.getProcurementById = async (req, res) => {
  try {
    const { id } = req.params;
    const procurement = await Procurement.findById(id).populate("recordedBy", "name email");

    if (!procurement) {
      return res.status(404).json({
        success: false,
        message: "Procurement record not found"
      });
    }

    res.status(200).json({
      success: true,
      data: procurement
    });
  } catch (error) {
    console.error("Error fetching procurement:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching procurement record",
      error: error.message
    });
  }
};

// Update procurement record
exports.updateProcurement = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedProcurement = await Procurement.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true
    });

    if (!updatedProcurement) {
      return res.status(404).json({
        success: false,
        message: "Procurement record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Procurement record updated successfully",
      data: updatedProcurement
    });
  } catch (error) {
    console.error("Error updating procurement:", error);
    res.status(500).json({
      success: false,
      message: "Error updating procurement record",
      error: error.message
    });
  }
};

// Delete procurement record
exports.deleteProcurement = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProcurement = await Procurement.findByIdAndDelete(id);

    if (!deletedProcurement) {
      return res.status(404).json({
        success: false,
        message: "Procurement record not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Procurement record deleted successfully",
      data: deletedProcurement
    });
  } catch (error) {
    console.error("Error deleting procurement:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting procurement record",
      error: error.message
    });
  }
};
