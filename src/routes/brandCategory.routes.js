import express from 'express';
import {
  getBrandCategories,
  getBrandCategoryById,
  createBrandCategory,
  updateBrandCategory,
  deleteBrandCategory
} from '../controllers/brandCategory.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes (read-only)
router.get('/', protect, getBrandCategories);
router.get('/:id', protect, getBrandCategoryById);

// Admin routes (CRUD)
router.post('/', protect, authorize('admin'), createBrandCategory);
router.put('/:id', protect, authorize('admin'), updateBrandCategory);
router.delete('/:id', protect, authorize('admin'), deleteBrandCategory);

export default router;