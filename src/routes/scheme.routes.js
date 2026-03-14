import express from 'express';
import {
  createScheme,
  getSchemes,
  getSchemeById,
  updateScheme,
  deleteScheme,
  getActiveSchemes,
  getProductSchemes
} from '../controllers/scheme.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.request.js';
import {
  createSchemeValidation,
  updateSchemeValidation,
  schemeIdValidation,
  productIdValidation
} from '../validators/scheme.validator.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   POST /api/schemes
// @desc    Create a new scheme
// @access  Private
router.post(
  '/',
  validateRequest(createSchemeValidation),
  createScheme
);

// @route   GET /api/schemes/active
// @desc    Get all active schemes
// @access  Private
router.get('/active', getActiveSchemes);

// @route   GET /api/schemes/product/:productId
// @desc    Get schemes for a specific product
// @access  Private
router.get(
  '/product/:productId',
  validateRequest(productIdValidation, 'params'),
  getProductSchemes
);

// @route   GET /api/schemes
// @desc    Get all schemes with pagination and filters
// @access  Private
router.get('/', getSchemes);

// @route   GET /api/schemes/:id
// @desc    Get scheme by ID
// @access  Private
router.get(
  '/:id',
  validateRequest(schemeIdValidation, 'params'),
  getSchemeById
);

// @route   PATCH /api/schemes/:id
// @desc    Update scheme
// @access  Private
router.patch(
  '/:id',
  validateRequest(schemeIdValidation, 'params'),
  validateRequest(updateSchemeValidation),
  updateScheme
);

// @route   DELETE /api/schemes/:id
// @desc    Delete scheme (soft delete)
// @access  Private
router.delete(
  '/:id',
  validateRequest(schemeIdValidation, 'params'),
  deleteScheme
);

export default router;