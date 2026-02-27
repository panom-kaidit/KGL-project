const Inventory = require("../models/Inventory");

exports.getInventory = async (req, res) => {
  try {
    const items = await Inventory.find().sort({ itemName: 1 }).lean();

    const total         = items.length;
    const inStockCount  = items.filter(i => i.stockKg > 200).length;
    const lowStockCount = items.filter(i => i.stockKg > 0 && i.stockKg <= 200).length;
    const outOfStockCount = items.filter(i => i.stockKg === 0).length;

    const totalStockPercentage = total > 0
      ? Math.round((inStockCount / total) * 100)
      : 0;

    res.json({
      summary: {
        totalStockPercentage,
        inStockCount,
        lowStockCount,
        outOfStockCount,
        total
      },
      items
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
