import express from 'express';
import {
  syncCustomersController,
  syncProductsController,
  syncSalesController,
  syncAllDataController
} from '../controllers/sync.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   POST /api/sync/customers
// @desc    Sync customers from AccountGST
// @access  Private
router.post('/customers', syncCustomersController);

// @route   POST /api/sync/products
// @desc    Sync products from AccountGST
// @access  Private
router.post('/products', syncProductsController);

// @route   POST /api/sync/sales
// @desc    Sync sales from AccountGST
// @access  Private
router.post('/sales', syncSalesController);

// @route   POST /api/sync/all
// @desc    Sync all data from AccountGST
// @access  Private
router.post('/all', syncAllDataController);

export default router;