import orderService from '../services/order.service.js';

// @desc    Create order from inquiry
// @route   POST /api/orders/from-inquiry
// @access  Private
export const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrderFromInquiry(
      req.body.inquiryId,
      req.user._id
    );

    // Check if AccountGST sync was successful
    const accountgstStatus = order.accountgstSyncStatus;
    const accountgstMessage = order.accountgstSyncError;

    res.status(201).json({
      success: true,
      message: accountgstStatus === 'synced'
        ? 'Order created and synced to AccountGST successfully'
        : accountgstStatus === 'failed'
          ? `Order created but AccountGST sync failed: ${accountgstMessage}`
          : 'Order created successfully',
      data: order
    });
  } catch (error) {
    if (error.message === 'Inquiry not found') {
      return res.status(404).json({
        success: false,
        message: 'Inquiry not found'
      });
    }
    if (error.message === 'Inquiry has already been converted to an order') {
      return res.status(400).json({
        success: false,
        message: 'Inquiry has already been converted to an order'
      });
    }
    if (error.message === 'Cannot create order from empty inquiry') {
      return res.status(400).json({
        success: false,
        message: 'Cannot create order from empty inquiry'
      });
    }
    if (error.message === 'Customer not found') {
      return res.status(400).json({
        success: false,
        message: 'Customer not found'
      });
    }
    next(error);
  }
};

// @desc    Retry AccountGST sync for order
// @route   POST /api/orders/:id/retry-sync
// @access  Private
export const retrySync = async (req, res, next) => {
  try {
    const order = await orderService.retryAccountGSTSync(req.params.id);

    res.json({
      success: true,
      message: 'Order synced to AccountGST successfully',
      data: order
    });
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    if (error.message === 'Order already synced with AccountGST') {
      return res.status(400).json({
        success: false,
        message: 'Order already synced with AccountGST'
      });
    }
    if (error.message === 'Customer not synced with AccountGST') {
      return res.status(400).json({
        success: false,
        message: 'Customer not synced with AccountGST. Please sync the customer first.'
      });
    }
    next(error);
  }
};

// @desc    Get all orders with pagination and filters
// @route   GET /api/orders
// @access  Private
export const getOrders = async (req, res, next) => {
  try {
    const { page, limit, status } = req.query;

    const result = await orderService.getOrders({
      page: page || 1,
      limit: limit || 10,
      status: status || '',
      userId: req.user._id // Filter by logged-in user
    });

    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user._id);

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    next(error);
  }
};

// @desc    Update order status
// @route   PATCH /api/orders/:id/status
// @access  Private
export const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await orderService.updateOrderStatus(
      req.params.id,
      req.body.status
    );

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    if (error.message === 'Order not found') {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    next(error);
  }
};