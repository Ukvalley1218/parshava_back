import express from 'express';
import {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiry,
  deleteInquiry,
  addProduct,
  updateProduct,
  removeProduct,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  submitCart
} from '../controllers/inquiry.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.request.js';
import {
  createInquiryValidation,
  addProductValidation,
  updateProductValidation,
  inquiryIdValidation,
  updateInquiryValidation,
  addToCartValidation,
  updateCartItemValidation,
  updateCartItemBodyValidation,
  submitCartValidation
} from '../validators/inquiry.validator.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// ============================================
// CART ROUTES (must come before /:id routes)
// ============================================

// @route   GET /api/inquiries/cart
// @desc    Get user's cart (draft inquiry)
// @access  Private
router.get('/cart', getCart);

// @route   POST /api/inquiries/cart/add
// @desc    Add product to cart
// @access  Private
router.post(
  '/cart/add',
  validateRequest(addToCartValidation),
  addToCart
);

// @route   PATCH /api/inquiries/cart/update/:productId
// @desc    Update product in cart
// @access  Private
router.patch(
  '/cart/update/:productId',
  validateRequest(updateCartItemValidation, 'params'),
  validateRequest(updateCartItemBodyValidation),
  updateCartItem
);

// @route   DELETE /api/inquiries/cart/remove/:productId
// @desc    Remove product from cart
// @access  Private
router.delete(
  '/cart/remove/:productId',
  removeFromCart
);

// @route   DELETE /api/inquiries/cart/clear
// @desc    Clear cart (remove all items)
// @access  Private
router.delete('/cart/clear', clearCart);

// @route   POST /api/inquiries/cart/submit
// @desc    Submit cart as inquiry
// @access  Private
router.post(
  '/cart/submit',
  validateRequest(submitCartValidation),
  submitCart
);

// ============================================
// INQUIRY ROUTES
// ============================================

// @route   POST /api/inquiries
// @desc    Create a new inquiry
// @access  Private
router.post(
  '/',
  validateRequest(createInquiryValidation),
  createInquiry
);

// @route   GET /api/inquiries
// @desc    Get all inquiries with pagination and filters
// @access  Private
router.get('/', getInquiries);

// @route   GET /api/inquiries/:id
// @desc    Get inquiry by ID
// @access  Private
router.get(
  '/:id',
  validateRequest(inquiryIdValidation, 'params'),
  getInquiryById
);

// @route   PATCH /api/inquiries/:id
// @desc    Update inquiry status
// @access  Private
router.patch(
  '/:id',
  validateRequest(inquiryIdValidation, 'params'),
  validateRequest(updateInquiryValidation),
  updateInquiry
);

// @route   DELETE /api/inquiries/:id
// @desc    Delete inquiry (soft delete)
// @access  Private
router.delete(
  '/:id',
  validateRequest(inquiryIdValidation, 'params'),
  deleteInquiry
);

// @route   POST /api/inquiries/:id/add-product
// @desc    Add product to inquiry
// @access  Private
router.post(
  '/:id/add-product',
  validateRequest(inquiryIdValidation, 'params'),
  validateRequest(addProductValidation),
  addProduct
);

// @route   PATCH /api/inquiries/:id/update-product
// @desc    Update product in inquiry
// @access  Private
router.patch(
  '/:id/update-product',
  validateRequest(inquiryIdValidation, 'params'),
  validateRequest(updateProductValidation),
  updateProduct
);

// @route   DELETE /api/inquiries/:id/remove-product
// @desc    Remove product from inquiry
// @access  Private
router.delete(
  '/:id/remove-product',
  validateRequest(inquiryIdValidation, 'params'),
  removeProduct
);

export default router;