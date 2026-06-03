import express from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategorySubcategories,
  getCategorySeries
} from '../controllers/category.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes (read-only)
router.get('/', protect, getCategories);
router.get('/:id', protect, getCategoryById);
router.get('/:id/subcategories', protect, getCategorySubcategories);
router.get('/:id/series', protect, getCategorySeries);

// Admin routes (CRUD)
router.post('/', protect, authorize('admin'), createCategory);
router.put('/:id', protect, authorize('admin'), updateCategory);
router.delete('/:id', protect, authorize('admin'), deleteCategory);

export default router;