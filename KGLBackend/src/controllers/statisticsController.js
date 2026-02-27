const Sale = require("../models/sales");

const WEEK_ORDER  = ["Week 1", "Week 2", "Week 3", "Week 4"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

exports.getManagerStatistics = async (req, res) => {
  try {
    if (req.user.role !== "Manager") {
      return res.status(403).json({ message: "Access denied" });
    }

    const now          = new Date();
    const yearStr      = String(now.getFullYear());
    const monthStr     = `${yearStr}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    // Three independent aggregations run in parallel
    const [monthlySalesResult, customerActivityResult, yearlyResult] = await Promise.all([

      // ── 1. Monthly Sales: sum amountPaid grouped by week within current month ──
      Sale.aggregate([
        { $match: { amountPaid: { $gt: 0 }, date: { $regex: `^${monthStr}` } } },
        {
          $addFields: {
            day: { $toInt: { $substr: ["$date", 8, 2] } }
          }
        },
        {
          $addFields: {
            week: {
              $switch: {
                branches: [
                  { case: { $lte: ["$day",  7] }, then: "Week 1" },
                  { case: { $lte: ["$day", 14] }, then: "Week 2" },
                  { case: { $lte: ["$day", 21] }, then: "Week 3" }
                ],
                default: "Week 4"
              }
            }
          }
        },
        {
          $group: {
            _id:   "$week",
            total: { $sum: "$amountPaid" }
          }
        }
      ]),

      // ── 2. Customer Activity: New / Returning / Inactive ──
      // New       = first AND last sale both in current month
      // Returning = first sale before current month, last sale IN current month
      // Inactive  = last sale was before current month
      Sale.aggregate([
        { $match: { contact: { $nin: [null, ""] } } },
        {
          $group: {
            _id:        "$contact",
            firstMonth: { $min: { $substr: ["$date", 0, 7] } },
            lastMonth:  { $max: { $substr: ["$date", 0, 7] } }
          }
        },
        {
          $group: {
            _id: null,
            newCount: {
              $sum: {
                $cond: [
                  { $and: [
                    { $eq: ["$firstMonth", monthStr] },
                    { $eq: ["$lastMonth",  monthStr] }
                  ]},
                  1, 0
                ]
              }
            },
            returningCount: {
              $sum: {
                $cond: [
                  { $and: [
                    { $lt: ["$firstMonth", monthStr] },
                    { $eq: ["$lastMonth",  monthStr] }
                  ]},
                  1, 0
                ]
              }
            },
            inactiveCount: {
              $sum: {
                $cond: [{ $lt: ["$lastMonth", monthStr] }, 1, 0]
              }
            }
          }
        }
      ]),

      // ── 3. Yearly Overview: sum amountPaid grouped by month for current year ──
      Sale.aggregate([
        { $match: { amountPaid: { $gt: 0 }, date: { $regex: `^${yearStr}` } } },
        {
          $group: {
            _id:   { $toInt: { $substr: ["$date", 5, 2] } },
            total: { $sum: "$amountPaid" }
          }
        },
        { $sort: { _id: 1 } }
      ])

    ]);

    // ── Shape: monthly sales ──
    const weekMap = {};
    monthlySalesResult.forEach(w => { weekMap[w._id] = w.total; });
    const monthlySalesData = WEEK_ORDER.map(w => weekMap[w] || 0);

    // ── Shape: customer activity ──
    const act = customerActivityResult[0] || { newCount: 0, returningCount: 0, inactiveCount: 0 };

    // ── Shape: yearly overview ──
    const monthMap = {};
    yearlyResult.forEach(m => { monthMap[m._id] = m.total; });
    const yearlyData = Array.from({ length: 12 }, (_, i) => monthMap[i + 1] || 0);

    return res.status(200).json({
      monthlySales: {
        labels: WEEK_ORDER,
        data:   monthlySalesData
      },
      customerActivity: {
        labels: ["New", "Returning", "Inactive"],
        data:   [act.newCount, act.returningCount, act.inactiveCount]
      },
      yearlyOverview: {
        labels: MONTH_NAMES,
        data:   yearlyData
      }
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
