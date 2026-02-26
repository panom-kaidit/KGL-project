const Procurement = require("../models/procurement");

// Create procurement record
exports.createProcurement = async (req, res) => {
  try {
    const {
      supplier_name,
      supplier_contact,
      purchase_date,
      invoice_number,
      product_name,
      product_category,
      quantity,
      unit_price,
      total_amount,
      payment_method,
      payment_status
    } = req.body;

    // Validate required fields
    if (!supplier_name || !supplier_contact || !purchase_date || !invoice_number || 
        !product_name || !quantity || !unit_price || !payment_method || !payment_status) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields"
      });
    }

    // Calculate total amount if not provided
    let finalTotal = total_amount;
    if (!finalTotal || finalTotal === 0) {
      finalTotal = quantity * unit_price;
    }

    // Create new procurement record
    const newProcurement = new Procurement({
      produceName: product_name,
      produceType: product_category,
      date: purchase_date,
      time: new Date().toLocaleTimeString(),
      tonnage: quantity,
      cost: unit_price,
      dealerName: supplier_name,
      contact: supplier_contact,
      sellingPrice: finalTotal,
      recordedBy: req.user ? req.user.id : null
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
