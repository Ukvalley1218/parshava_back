import express from 'express';
import {
  syncProducts,
  getProducts,
  getProductById,
  getAllBrands,
  getBrands,
  getCategories,
  getProductTypes,
  getBrandCategories,
  getCategorySubcategories
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

// @route   GET /api/products/brands/all
// @desc    Get all brands from Brand collection
// @access  Private
router.get('/brands/all', getAllBrands);

// @route   GET /api/products/brands
// @desc    Get unique brands list, optionally filtered by category
// @access  Private
router.get('/brands', getBrands);

// @route   GET /api/products/categories
// @desc    Get unique categories list, optionally filtered by brand
// @access  Private
router.get('/categories', getCategories);

// @route   GET /api/products/subcategories
// @desc    Get unique productTypes (subcategories), filtered by brand and category
// @access  Private
router.get('/subcategories', getProductTypes);

// @route   GET /api/products/brand/:brandId/categories
// @desc    Get categories for a specific brand from Brand collection
// @access  Private
router.get('/brand/:brandId/categories', getBrandCategories);

// @route   GET /api/products/brand/:brandId/category/:categoryId/subcategories
// @desc    Get subcategories for a specific brand and category from Brand collection
// @access  Private
router.get('/brand/:brandId/category/:categoryId/subcategories', getCategorySubcategories);

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