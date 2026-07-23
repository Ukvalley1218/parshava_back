import express from 'express';
import {
  createEnquiry,
  getEnquiries,
  getEnquiryById,
  updateEnquiry,
  deleteEnquiry,
  linkQuotation,
  getEnquiryCounts
} from '../controllers/enquiry.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validate.request.js';
import {
  createEnquiryValidation,
  updateEnquiryValidation,
  enquiryIdValidation,
  linkQuotationValidation
} from '../validators/enquiry.validator.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/enquiries/counts
// @desc    Get enquiry counts by status
// @access  Private
router.get('/counts', getEnquiryCounts);

// @route   POST /api/enquiries
// @desc    Create a new enquiry
// @access  Private
router.post(
  '/',
  validateRequest(createEnquiryValidation),
  createEnquiry
);

// @route   GET /api/enquiries
// @desc    Get all enquiries
// @access  Private
router.get('/', getEnquiries);

// @route   GET /api/enquiries/:id
// @desc    Get enquiry by ID
// @access  Private
router.get(
  '/:id',
  validateRequest(enquiryIdValidation, 'params'),
  getEnquiryById
);

// @route   PATCH /api/enquiries/:id
// @desc    Update enquiry
// @access  Private
router.patch(
  '/:id',
  validateRequest(enquiryIdValidation, 'params'),
  validateRequest(updateEnquiryValidation),
  updateEnquiry
);

// @route   DELETE /api/enquiries/:id
// @desc    Delete enquiry (soft delete)
// @access  Private
router.delete(
  '/:id',
  validateRequest(enquiryIdValidation, 'params'),
  deleteEnquiry
);

// @route   POST /api/enquiries/:id/link-quotation
// @desc    Link a quotation to an enquiry
// @access  Private
router.post(
  '/:id/link-quotation',
  validateRequest(enquiryIdValidation, 'params'),
  validateRequest(linkQuotationValidation),
  linkQuotation
);

export default router;