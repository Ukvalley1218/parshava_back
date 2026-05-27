import express from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  retrySync
} from '../controllers/order.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.request.js';
import {
  createOrderValidation,
  updateStatusValidation,
  orderIdValidation
} from '../validators/order.validator.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   POST /api/orders/from-inquiry
// @desc    Create order from inquiry
// @access  Private
router.post(
  '/from-inquiry',
  validateRequest(createOrderValidation),
  createOrder
);

// @route   POST /api/orders/:id/retry-sync
// @desc    Retry AccountGST sync for failed order
// @access  Private
router.post(
  '/:id/retry-sync',
  validateRequest(orderIdValidation, 'params'),
  retrySync
);

// @route   GET /api/orders
// @desc    Get all orders with pagination and filters
// @access  Private
router.get('/', getOrders);

// @route   GET /api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get(
  '/:id',
  validateRequest(orderIdValidation, 'params'),
  getOrderById
);

// @route   PATCH /api/orders/:id/status
// @desc    Update order status
// @access  Private
router.patch(
  '/:id/status',
  validateRequest(orderIdValidation, 'params'),
  validateRequest(updateStatusValidation),
  updateOrderStatus
);

export default router;