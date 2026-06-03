import express from 'express';
import {
  getBusinessCategories,
  getBusinessCategoryById,
  createBusinessCategory,
  updateBusinessCategory,
  deleteBusinessCategory
} from '../controllers/businessCategory.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes (read-only)
router.get('/', protect, getBusinessCategories);
router.get('/:id', protect, getBusinessCategoryById);

// Admin routes (CRUD)
router.post('/', protect, authorize('admin'), createBusinessCategory);
router.put('/:id', protect, authorize('admin'), updateBusinessCategory);
router.delete('/:id', protect, authorize('admin'), deleteBusinessCategory);

export default router;