import Sale from '../models/sale.model.js';
import Customer from '../models/customer.model.js';
import Order from '../models/order.model.js';
import Inquiry from '../models/inquiry.model.js';
import Product from '../models/product.model.js';

class DashboardService {
  /**
   * Get dashboard summary
   * @returns {Object} Dashboard summary data
   */
 async getDashboardSummary() {

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Today's sales
  const todaySalesResult = await Sale.aggregate([
    {
      $match: {
        invoiceDate: { $gte: today, $lt: tomorrow }
      }
    },
    {
      $group: {
        _id: null,
        todaySales: { $sum: "$totalValue" }
      }
    }
  ]);

  // Total outstanding (pending invoices)
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

  // Overdue invoices (>30 days)
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

  // Pending orders
  const pendingOrders = await Order.countDocuments({ status: "pending" });

  // Total orders
  const totalOrders = await Order.countDocuments();

  // Draft inquiries (not converted yet)
  const inquiryCount = await Inquiry.countDocuments({ status: "draft" });

  // Total products
  const totalProducts = await Product.countDocuments();

  return {
    todaySales: todaySalesResult[0]?.todaySales || 0,
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
          totalPaid: { $sum: "$receivedAmount" }
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
        $unwind: "$customer"
      },
      {
        $project: {
          _id: 0,
          customerId: "$_id",
          name: "$customer.name",
          company: "$customer.firmName",
          contact: "$customer.contactPerson",
          city: "$customer.city",
          mobile: "$customer.mobile",
          outstanding: "$outstandingAmount",
          outstandingAmount: 1,
          totalPurchase: 1,
          totalPaid: 1
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
          paidStatus: { $in: ['unpaid', 'partial', ''] },
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
        $unwind: '$customer'
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
          name: '$customer.name',
          company: '$customer.firmName',
          contact: '$customer.contactPerson',
          city: '$customer.city',
          mobile: '$customer.mobile',
          overdueAmount: 1,
          outstanding: '$overdueAmount',
          overdueDays: 1
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