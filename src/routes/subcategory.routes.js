import express from 'express';
import {
  getSubcategories,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory
} from '../controllers/subcategory.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes (read-only)
router.get('/', protect, getSubcategories);
router.get('/:id', protect, getSubcategoryById);

// Admin routes (CRUD)
router.post('/', protect, authorize('admin'), createSubcategory);
router.put('/:id', protect, authorize('admin'), updateSubcategory);
router.delete('/:id', protect, authorize('admin'), deleteSubcategory);

export default router;