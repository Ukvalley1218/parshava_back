import User from '../../models/User.js';
import Customer from '../../models/customer.model.js';
import Inquiry from '../../models/inquiry.model.js';
import Order from '../../models/order.model.js';

/**
 * Get dashboard statistics
 * @route GET /api/admin/dashboard/stats
 * @access Private (Admin)
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    // Get counts in parallel
    const [
      totalUsers,
      totalCustomers,
      totalInquiries,
      totalOrders,
      totalRevenue
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: 'admin' } }),
      Customer.countDocuments(),
      Inquiry.countDocuments({ status: { $ne: 'cancelled' } }),
      Order.countDocuments({ status: { $ne: 'cancelled' } }),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$grandTotal' } } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCustomers,
        totalInquiries,
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent inquiries
 * @route GET /api/admin/dashboard/recent-inquiries
 * @access Private (Admin)
 */
export const getRecentInquiries = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const inquiries = await Inquiry.find()
      .populate('customerId', 'name mobile email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: inquiries
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get recent orders
 * @route GET /api/admin/dashboard/recent-orders
 * @access Private (Admin)
 */
export const getRecentOrders = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const orders = await Order.find()
      .populate('customerId', 'name mobile email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    next(error);
  }
};