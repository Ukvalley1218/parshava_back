import axios from 'axios';
import Order from '../models/order.model.js';
import Inquiry from '../models/inquiry.model.js';
import Customer from '../models/customer.model.js';
import Product from '../models/product.model.js';
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
 * Format date for AccountGST API (dd-mm-yyyy)
 * @param {Date} date - Date object
 * @returns {String} Formatted date string
 */
const formatDateForAccountGST = (date) => {
  const d = date || new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

/**
 * Create sales order in AccountGST
 * @param {Object} order - Order data
 * @param {Object} customer - Customer data with AccountGST ID
 * @param {Array} items - Order items
 * @param {String} userId - User ID
 * @returns {Object} AccountGST response
 */
const createSalesOrderInAccountGST = async (order, customer, items, userId) => {
  // Format product details for AccountGST
  const productDetails = items.map(item => {
    const priceWithGST = item.price * (1 + item.gstRate / 100);
    const priceWithoutGST = item.price;
    const quantity = item.qty || item.quantity || 1;
    const discount = item.discount || 0;

    return {
      productid: item.accountgstProductId || item.productId?.toString() || '',
      quantity: String(quantity),
      description: item.productName || item.name || '',
      pricewithgst: String(Math.round(priceWithGST * 100) / 100),
      pricewithoutgst: String(Math.round(priceWithoutGST * 100) / 100),
      discount: String(discount),
      netamount: '0' // Always send 0 as per API docs
    };
  });

  // Calculate total amount
  const voucherAmount = items.reduce((sum, item) => {
    const qty = item.qty || item.quantity || 1;
    const price = item.price || 0;
    const discount = item.discount || 0;
    const gstRate = item.gstRate || 0;
    const taxableValue = price * qty * (1 - discount / 100);
    const totalWithGST = taxableValue * (1 + gstRate / 100);
    return sum + totalWithGST;
  }, 0);

  // Prepare voucher data
  const voucherData = {
    customerid: customer.accountgstId || '',
    userid: '1', // Default user ID - can be made configurable
    voucherdate: formatDateForAccountGST(order.createdAt || new Date()),
    ponum: order.orderNumber || '',
    podate: formatDateForAccountGST(order.createdAt || new Date()),
    shipto: customer.firmName || customer.name || 'Unknown',
    shipadddress: customer.address || '',
    shipgstin: customer.gstin || '',
    shippin: customer.pincode || '',
    contactperson: customer.name || '',
    contactnum: customer.mobile || '',
    transporterid: '', // Optional - can be added later
    voucheramount: String(Math.round(voucherAmount * 100) / 100),
    locationid: '', // Optional - can be added later
    salesmanid: '', // Optional - can be added later
    productdetails: productDetails,
    actionfrom: 'E-Store Enquiry',
    doroundup: 1,
    narration: `Order created from inquiry ${order.inquiryId || ''}`,
    internalremark: '',
    salesledgerid: '',
    condition: {
      disablebatch: 1
    }
  };

  return await makeAccountGSTRequest('salesordercreate.php', {
    voucherdata: voucherData
  });
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

/**
 * Update product stock after order creation
 * @param {Array} items - Order items with productId and qty
 * @returns {Object} Stock update result
 */
const updateProductStock = async (items) => {
  const stockUpdates = [];

  for (const item of items) {
    const productId = item.productId?._id || item.productId;
    const qty = item.qty || 1;

    if (!productId) continue;

    try {
      const product = await Product.findById(productId);

      if (product) {
        const previousStock = product.stock || 0;
        const newStock = Math.max(0, previousStock - qty);

        await Product.findByIdAndUpdate(
          productId,
          { stock: newStock },
          { new: true }
        );

        stockUpdates.push({
          productId,
          productName: product.name || item.productName,
          previousStock,
          quantityOrdered: qty,
          newStock,
          success: true
        });
      }
    } catch (error) {
      console.error(`Failed to update stock for product ${productId}:`, error.message);
      stockUpdates.push({
        productId,
        productName: item.productName || 'Unknown',
        quantityOrdered: qty,
        success: false,
        error: error.message
      });
    }
  }

  return stockUpdates;
};

class OrderService {
  /**
   * Create order from inquiry
   * @param {String} inquiryId - Inquiry ID
   * @param {String} userId - User ID creating the order
   * @returns {Object} Created order
   */
  async createOrderFromInquiry(inquiryId, userId) {
    // Fetch inquiry with populated items
    const inquiry = await Inquiry.findById(inquiryId)
      .populate('customerId')
      .populate('items.productId', 'accountgstProductId name partNumber');

    if (!inquiry) {
      throw new Error('Inquiry not found');
    }

    if (inquiry.status === 'converted') {
      throw new Error('Inquiry has already been converted to an order');
    }

    if (inquiry.items.length === 0) {
      throw new Error('Cannot create order from empty inquiry');
    }

    // Check if any products in inquiry are missing/deleted
    const missingProducts = inquiry.items.filter(item => !item.productId);
    if (missingProducts.length > 0) {
      const productNames = missingProducts.map(item => item.productName || 'Unknown product').join(', ');
      throw new Error(`Cannot create order: Some products have been deleted from the system (${productNames}). Please remove these items from the inquiry and try again.`);
    }

    // Validate all items have required fields
    const invalidItems = inquiry.items.filter(item => {
      const hasMissingFields = !item.productName ||
        item.price === undefined || item.price === null ||
        item.qty === undefined || item.qty === null ||
        item.gstRate === undefined || item.gstRate === null;
      return hasMissingFields;
    });

    if (invalidItems.length > 0) {
      console.error('Invalid items in inquiry:', invalidItems);
      throw new Error('Some items in the inquiry have missing required fields (name, price, quantity, or GST rate). Please recreate the inquiry.');
    }

    // Check if customer exists
    if (!inquiry.customerId) {
      throw new Error('Inquiry does not have a customer assigned');
    }

    // Get customer with AccountGST ID
    const customerId = inquiry.customerId._id || inquiry.customerId;
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new Error('Customer not found');
    }

    // Generate order number
    const orderNumber = await generateOrderNumber();

    // Prepare customer details snapshot
    const customerDetails = {
      name: customer.name || '',
      firmName: customer.firmName || customer.name || '',
      mobile: customer.mobile || '',
      email: customer.email || '',
      gstin: customer.gstin || ''
    };

    // Prepare shipping address from customer
    const shippingAddress = {
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      pincode: customer.pincode || ''
    };

    // Create order in MongoDB
    const order = await Order.create({
      orderNumber,
      customerId: inquiry.customerId._id || inquiry.customerId,
      inquiryId: inquiry._id,
      customerDetails,
      shippingAddress,
      items: inquiry.items.map(item => ({
        productId: item.productId?._id || item.productId,
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
      createdBy: userId,
      accountgstSyncStatus: 'pending'
    });

    // Try to create sales order in AccountGST
    try {
      // Check if customer has AccountGST ID
      if (!customer.accountgstId) {
        console.warn('Customer does not have AccountGST ID, skipping sync');
        order.accountgstSyncStatus = 'failed';
        order.accountgstSyncError = 'Customer not synced with AccountGST';
        await order.save();
      } else {
        // Prepare items with AccountGST product IDs
        const itemsForAccountGST = inquiry.items.map(item => {
          const product = item.productId;
          return {
            productId: item.productId?._id || item.productId,
            accountgstProductId: product?.accountgstProductId || '',
            productName: item.productName,
            price: item.price,
            qty: item.qty,
            discount: item.discount,
            gstRate: item.gstRate
          };
        });

        // Check if all products have AccountGST IDs
        const productsWithoutGSTId = itemsForAccountGST.filter(
          item => !item.accountgstProductId
        );

        if (productsWithoutGSTId.length > 0) {
          console.warn('Some products do not have AccountGST IDs');
        }

        // Create sales order in AccountGST
        const response = await createSalesOrderInAccountGST(
          order.toObject(),
          customer.toObject(),
          itemsForAccountGST,
          userId
        );

        // Store AccountGST order ID if returned
        if (response.result && response.result.orderid) {
          order.accountgstOrderId = response.result.orderid;
          order.accountgstSyncStatus = 'synced';
          order.accountgstSyncError = undefined;
        } else if (response.result && response.result.order_id) {
          order.accountgstOrderId = response.result.order_id;
          order.accountgstSyncStatus = 'synced';
          order.accountgstSyncError = undefined;
        } else {
          order.accountgstSyncStatus = 'synced';
        }

        await order.save();
      }
    } catch (apiError) {
      console.error('AccountGST Sales Order Creation Error:', apiError.message);
      // Order is still saved in MongoDB even if AccountGST sync fails
      order.accountgstSyncStatus = 'failed';
      order.accountgstSyncError = apiError.message;
      await order.save();
    }

    // Update inquiry status to converted
    inquiry.status = 'converted';
    await inquiry.save();

    // Update product stock
    let stockUpdateResult = null;
    try {
      stockUpdateResult = await updateProductStock(inquiry.items);
      console.log('Stock update result:', stockUpdateResult);
    } catch (stockError) {
      console.error('Failed to update product stock:', stockError.message);
      // Don't fail the order if stock update fails
    }

    // Populate order for notification
    const populatedOrder = await order.populate('customerId', 'name firmName mobile email');

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

    return {
      ...populatedOrder.toObject(),
      stockUpdates: stockUpdateResult
    };
  }

  /**
   * Retry syncing order to AccountGST
   * @param {String} orderId - Order ID
   * @returns {Object} Updated order
   */
  async retryAccountGSTSync(orderId) {
    const order = await Order.findById(orderId)
      .populate('customerId')
      .populate('items.productId', 'accountgstProductId name');

    if (!order) {
      throw new Error('Order not found');
    }

    if (order.accountgstSyncStatus === 'synced') {
      throw new Error('Order already synced with AccountGST');
    }

    const customer = order.customerId;

    if (!customer || !customer.accountgstId) {
      throw new Error('Customer not synced with AccountGST');
    }

    try {
      const itemsForAccountGST = order.items.map(item => ({
        productId: item.productId?._id || item.productId,
        accountgstProductId: item.productId?.accountgstProductId || '',
        productName: item.productName,
        price: item.price,
        qty: item.qty,
        discount: item.discount,
        gstRate: item.gstRate
      }));

      const response = await createSalesOrderInAccountGST(
        order.toObject(),
        customer.toObject(),
        itemsForAccountGST,
        order.createdBy
      );

      if (response.result && (response.result.orderid || response.result.order_id)) {
        order.accountgstOrderId = response.result.orderid || response.result.order_id;
        order.accountgstSyncStatus = 'synced';
        order.accountgstSyncError = undefined;
      } else {
        order.accountgstSyncStatus = 'synced';
      }

      await order.save();
      return order;
    } catch (apiError) {
      order.accountgstSyncStatus = 'failed';
      order.accountgstSyncError = apiError.message;
      await order.save();
      throw apiError;
    }
  }

  /**
   * Get all orders with pagination and filters
   * @param {Object} options - Query options
   * @returns {Object} Orders with pagination info
   */
  async getOrders({ page = 1, limit = 10, status = '', userId = null }) {
    const query = {};

    // Filter by user - only show user's own orders
    if (userId) {
      query.createdBy = userId;
    }

    // Filter by status
    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('customerId', 'name firmName mobile email gstin address city state pincode')
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
   * @param {String} userId - User ID (optional, for authorization)
   * @returns {Object} Order details
   */
  async getOrderById(orderId, userId = null) {
    const query = { _id: orderId };

    // If userId is provided, only return order if it belongs to the user
    if (userId) {
      query.createdBy = userId;
    }

    const order = await Order.findOne(query)
      .populate('customerId', 'name firmName mobile email gstin address city state pincode')
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