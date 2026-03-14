import express from 'express';
import {
  getDashboardSummary,
  getTodaySales,
  getOutstandingCustomers,
  getOverdueCustomers,
  getTopCustomers
} from '../controllers/dashboard.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/dashboard/summary
// @desc    Get dashboard summary
// @access  Private
router.get('/summary', getDashboardSummary);

// @route   GET /api/dashboard/sales
// @desc    Get today's sales
// @access  Private
router.get('/sales', getTodaySales);

// @route   GET /api/dashboard/outstanding
// @desc    Get outstanding customers
// @access  Private
router.get('/outstanding', getOutstandingCustomers);

// @route   GET /api/dashboard/overdue
// @desc    Get overdue customers
// @access  Private
router.get('/overdue', getOverdueCustomers);

// @route   GET /api/dashboard/top-customers
// @desc    Get top customers by total purchase
// @access  Private
router.get('/top-customers', getTopCustomers);

export default router;