import axios from 'axios';
import Order from '../models/order.model.js';
import Inquiry from '../models/inquiry.model.js';
import Customer from '../models/customer.model.js';
import { createNotification } from './notification.service.js';

// Base URL for AccountGST API
const ACCOUNTGST_BASE_URL = process.env.ACCOUNTGST_BASE_URL || 'https://ultimate.accountgst.com/admin/api';

/**
 * Make request to AccountGST API
 * @param {String} endpoint - API endpoint
 * @param {Object} additionalPayload - Additional payload data
 * @returns {Object} API response data
 */
const makeAccountGSTRequest = async (endpoint, additionalPayload = {}) => {
  const payload = {
    connectingkey: process.env.ACCOUNTGST_KEY,
    companycode: process.env.ACCOUNTGST_COMPANY,
    ...additionalPayload
  };

  const response = await axios.post(
    `${ACCOUNTGST_BASE_URL}/${endpoint}`,
    payload,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );

  if (!response.data || response.data.status !== 'success') {
    throw new Error(`AccountGST API Error: ${response.data?.message || 'Unknown error'}`);
  }

  return response.data;
};

/**
 * Generate unique order number
 * @returns {String} Order number
 */
const generateOrderNumber = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  // Get count of orders created today
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));

  const count = await Order.countDocuments({
    createdAt: { $gte: startOfDay, $lte: endOfDay }
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `ORD${year}${month}${day}${sequence}`;
};

class OrderService {
  /**
   * Create order from inquiry
   * @param {String} inquiryId - Inquiry ID
   * @param {String} userId - User ID creating the order
   * @returns {Object} Created order
   */
  async createOrderFromInquiry(inquiryId, userId) {
    // Fetch inquiry
    const inquiry = await Inquiry.findById(inquiryId).populate('customerId');

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    if (inquiry.status === 'converted') {
      throw new Error('Inquiry has already been converted to an order');
    }

    if (inquiry.items.length === 0) {
      throw new Error('Cannot create order from empty inquiry');
    }

    // Get customer with AccountGST ID
    const customer = await Customer.findById(inquiry.customerId._id);

    if (!customer || !customer.accountgstId) {
      throw new Error('Customer not found or not synced with AccountGST');
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Create order in MongoDB
    const order = await Order.create({
      orderNumber,
      customerId: inquiry.customerId._id,
      inquiryId: inquiry._id,
      items: inquiry.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        price: item.price,
        qty: item.qty,
        discount: item.discount,
        gstRate: item.gstRate,
        total: item.total
      })),
      subtotal: inquiry.subtotal,
      gstTotal: inquiry.gstTotal,
      grandTotal: inquiry.grandTotal,
      status: 'pending',
      createdBy: userId
    });

    // Try to create invoice in AccountGST
    try {
      // Format items for AccountGST API
      const invoiceItems = inquiry.items.map(item => ({
        productconnectid: item.productId,
        productname: item.productName,
        qty: item.qty,
        rate: item.price,
        discount: item.discount,
        gst: item.gstRate,
        total: item.total
      }));

      const response = await makeAccountGSTRequest('salescreate.php', {
        refmasterconnectid: customer.accountgstId,
        items: invoiceItems,
        subtotal: inquiry.subtotal,
        gsttotal: inquiry.gstTotal,
        grandtotal: inquiry.grandTotal
      });

      // Store AccountGST invoice ID if returned
      if (response.result && response.result.invoice_id) {
        order.accountgstInvoiceId = response.result.invoice_id;
        await order.save();
      }
    } catch (apiError) {
      console.error('AccountGST Invoice Creation Error:', apiError.message);
      // Order is still saved in MongoDB even if AccountGST sync fails
      // The order can be manually synced later
    }

    // Update inquiry status to converted
    inquiry.status = 'converted';
    await inquiry.save();

    // Populate order for notification
    const populatedOrder = await order.populate('customerId', 'name mobile email');

    // Create notification for new order
    try {
      await createNotification({
        title: 'New Order Created',
        message: `Order ${order.orderNumber} created successfully`,
        type: 'order',
        userId: order.createdBy.toString()
      });
    } catch (error) {
      console.error('Notification failed:', error.message);
    }

    return populatedOrder;
  }

  /**
   * Get all orders with pagination and filters
   * @param {Object} options - Query options
   * @returns {Object} Orders with pagination info
   */
  async getOrders({ page = 1, limit = 10, status = '' }) {
    const query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customerId', 'name mobile email')
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Order.countDocuments(query)
    ]);

    return {
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    };
  }

  /**
   * Get order by ID
   * @param {String} orderId - Order ID
   * @returns {Object} Order details
   */
  async getOrderById(orderId) {
    const order = await Order.findById(orderId)
      .populate('customerId', 'name mobile email address city state gstin')
      .populate('inquiryId')
      .populate('createdBy', 'name email');

    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  /**
   * Update order status
   * @param {String} orderId - Order ID
   * @param {String} status - New status
   * @returns {Object} Updated order
   */
  async updateOrderStatus(orderId, status) {
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true, runValidators: true }
    )
      .populate('customerId', 'name mobile email')
      .populate('createdBy', 'name email');

    if (!order) {
      throw new Error('Order not found');
    }

    // Create notification for order status update
    try {
      await createNotification({
        title: 'Order Status Updated',
        message: `Order ${order.orderNumber} status changed to ${order.status}`,
        type: 'order',
        userId: order.createdBy._id.toString()
      });
    } catch (error) {
      console.error('Notification failed:', error.message);
    }

    return order;
  }
}

export default new OrderService();