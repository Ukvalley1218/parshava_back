import Sale from '../models/sale.model.js';
import Customer from '../models/customer.model.js';
import Order from '../models/order.model.js';
import Inquiry from '../models/inquiry.model.js';
import Product from '../models/product.model.js';

class DashboardService {
  /**
   * Get dashboard summary
   * @param {String} userId - User ID to filter orders
   * @returns {Object} Dashboard summary data
   */
 async getDashboardSummary(userId = null) {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // First day of current month
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  // Build order query with user filter
  const orderQuery = {};
  if (userId) {
    orderQuery.createdBy = userId;
  }

  // Today's orders (sales made today)
  const todayOrdersResult = await Order.aggregate([
    {
      $match: {
        ...orderQuery,
        createdAt: { $gte: today, $lt: tomorrow }
      }
    },
    {
      $group: {
        _id: null,
        todaySales: { $sum: "$grandTotal" }
      }
    }
  ]);

  // Monthly orders (for monthly collection)
  const monthlyOrdersResult = await Order.aggregate([
    {
      $match: {
        ...orderQuery,
        createdAt: { $gte: firstDayOfMonth, $lte: today }
      }
    },
    {
      $group: {
        _id: null,
        monthlyCollected: { $sum: "$grandTotal" },
        monthlySales: { $sum: "$grandTotal" }
      }
    }
  ]);

  // Total outstanding from Sales model (pending invoices from accounting system)
  const outstandingResult = await Sale.aggregate([
    {
      $match: {
        pendingAmount: { $gt: 0 }
      }
    },
    {
      $group: {
        _id: null,
        totalOutstanding: { $sum: "$pendingAmount" }
      }
    }
  ]);

  // Overdue invoices (>30 days) from Sales model
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const overdueResult = await Sale.aggregate([
    {
      $match: {
        pendingAmount: { $gt: 0 },
        invoiceDate: { $lt: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: null,
        overdueAmount: { $sum: "$pendingAmount" }
      }
    }
  ]);

  // Pending orders (filtered by user)
  const pendingOrders = await Order.countDocuments({ ...orderQuery, status: "pending" });

  // Total orders (filtered by user)
  const totalOrders = await Order.countDocuments(orderQuery);

  // Draft inquiries (filtered by user, only with customer assigned)
  // 'draft' tab shows both 'draft' and 'pending' status inquiries
  const inquiryQuery = {
    status: { $in: ["draft", "pending"] },
    customerId: { $exists: true, $ne: null }
  };
  if (userId) {
    inquiryQuery.createdBy = userId;
  }
  const inquiryCount = await Inquiry.countDocuments(inquiryQuery);

  // Total products (only active/continued products)
  const totalProducts = await Product.countDocuments({ active: { $ne: false } });

  return {
    todaySales: todayOrdersResult[0]?.todaySales || 0,
    monthlyCollected: monthlyOrdersResult[0]?.monthlyCollected || 0,
    monthlySales: monthlyOrdersResult[0]?.monthlySales || 0,
    totalOutstanding: outstandingResult[0]?.totalOutstanding || 0,
    overdueAmount: overdueResult[0]?.overdueAmount || 0,
    pendingOrders,
    totalOrders,
    inquiryCount,
    totalProducts
  };
}

  /**
   * Get today's sales
   * @returns {Object} Today's sales data
   */
 async getTodaySales() {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const result = await Sale.aggregate([
    {
      $match: {
        invoiceDate: { $gte: today, $lt: tomorrow }
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: "$totalValue" },
        invoiceCount: { $sum: 1 }
      }
    }
  ]);

  return {
    totalSales: result[0]?.totalSales || 0,
    invoiceCount: result[0]?.invoiceCount || 0
  };
}

  /**
   * Get outstanding customers
   * @returns {Array} List of customers with outstanding balance
   */
  async getOutstandingCustomers() {
    const today = new Date();

    const result = await Sale.aggregate([
      {
        $match: {
          pendingAmount: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: "$customerId",
          outstandingAmount: { $sum: "$pendingAmount" },
          totalPurchase: { $sum: "$totalValue" },
          totalPaid: { $sum: "$receivedAmount" },
          oldestInvoice: { $min: "$invoiceDate" }
        }
      },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customer"
        }
      },
      {
        $unwind: {
          path: "$customer",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          overdueDays: {
            $cond: {
              if: { $gt: ["$oldestInvoice", null] },
              then: {
                $floor: {
                  $divide: [
                    { $subtract: [today, "$oldestInvoice"] },
                    1000 * 60 * 60 * 24
                  ]
                }
              },
              else: 0
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          customerId: "$_id",
          name: { $ifNull: ["$customer.name", "Unknown"] },
          company: { $ifNull: ["$customer.firmName", "Unknown Company"] },
          contact: { $ifNull: ["$customer.contactPerson", ""] },
          city: { $ifNull: ["$customer.city", ""] },
          mobile: { $ifNull: ["$customer.mobile", ""] },
          outstanding: "$outstandingAmount",
          outstandingAmount: 1,
          totalPurchase: 1,
          totalPaid: 1,
          oldestInvoice: 1,
          overdueSince: "$oldestInvoice",
          overdueDays: 1
        }
      },
      {
        $sort: { outstandingAmount: -1 }
      }
    ]);

    return result;
  }

  /**
   * Get overdue customers (payment overdue by more than 30 days)
   * @returns {Array} List of overdue customers
   */
  async getOverdueCustomers() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await Sale.aggregate([
      {
        $match: {
          invoiceDate: { $lt: thirtyDaysAgo },
          pendingAmount: { $gt: 0 }
        }
      },
      {
        $group: {
          _id: '$customerId',
          overdueAmount: { $sum: '$pendingAmount' },
          outstanding: { $sum: '$pendingAmount' },
          oldestInvoice: { $min: '$invoiceDate' }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: {
          path: '$customer',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $addFields: {
          overdueDays: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$oldestInvoice'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          customerId: '$_id',
          name: { $ifNull: ['$customer.name', 'Unknown'] },
          company: { $ifNull: ['$customer.firmName', 'Unknown Company'] },
          contact: { $ifNull: ['$customer.contactPerson', ''] },
          city: { $ifNull: ['$customer.city', ''] },
          mobile: { $ifNull: ['$customer.mobile', ''] },
          overdueAmount: 1,
          outstanding: '$overdueAmount',
          overdueDays: 1,
          overdueSince: '$oldestInvoice'
        }
      },
      {
        $sort: { overdueAmount: -1 }
      }
    ]);

    return result;
  }

  /**
   * Get top customers by total purchase
   * @param {Number} limit - Number of customers to return
   * @returns {Array} List of top customers
   */
  async getTopCustomers(limit = 10) {
    const result = await Sale.aggregate([
      {
        $match: {
          customerId: { $ne: null }
        }
      },
      {
        $group: {
          _id: '$customerId',
          totalPurchase: { $sum: '$totalValue' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $unwind: '$customer'
      },
      {
        $project: {
          _id: 0,
          customerId: '$_id',
          customerName: '$customer.name',
          totalPurchase: 1,
          orderCount: 1
        }
      },
      {
        $sort: { totalPurchase: -1 }
      },
      {
        $limit: limit
      }
    ]);

    return result;
  }
}

export default new DashboardService();