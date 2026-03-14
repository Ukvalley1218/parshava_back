import express from 'express';
import {
  syncProducts,
  getProducts,
  getProductById,
  getBrands,
  getCategories
} from '../controllers/product.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import {
  validateProductQuery,
  productIdValidation
} from '../validators/product.validator.js';
import { validateRequest } from '../middleware/validate.request.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/products/brands
// @desc    Get unique brands list
// @access  Private
router.get('/brands', getBrands);

// @route   GET /api/products/categories
// @desc    Get unique categories list
// @access  Private
router.get('/categories', getCategories);

// @route   POST /api/products/sync
// @desc    Sync products from AccountGST
// @access  Private
router.post('/sync', syncProducts);

// @route   GET /api/products
// @desc    Get all products with pagination and filters
// @access  Private
router.get(
  '/',
  validateRequest(validateProductQuery, 'query'),
  getProducts
);

// @route   GET /api/products/:id
// @desc    Get product by ID
// @access  Private
router.get(
  '/:id',
  validateRequest(productIdValidation, 'params'),
  getProductById
);

export default router;