import express from 'express';
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  retrySync,
  getCities,
  addContactPerson,
  updateContactPerson,
  deleteContactPerson
} from '../controllers/customer.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import {
  createCustomerValidation,
  updateCustomerValidation,
  customerIdValidation
} from '../validators/customer.validator.js';
import { validateRequest } from '../middleware/validate.request.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// @route   GET /api/customers/cities
// @desc    Get unique cities list
// @access  Private
router.get('/cities', getCities);

// @route   POST /api/customers
// @desc    Create a new customer
// @access  Private
router.post(
  '/',
  validateRequest(createCustomerValidation),
  createCustomer
);

// @route   GET /api/customers
// @desc    Get all customers with pagination and filters
// @access  Private
router.get('/', getCustomers);

// @route   GET /api/customers/:id
// @desc    Get customer by ID
// @access  Private
router.get(
  '/:id',
  validateRequest(customerIdValidation, 'params'),
  getCustomerById
);

// @route   PATCH /api/customers/:id
// @desc    Update customer
// @access  Private
router.patch(
  '/:id',
  validateRequest(customerIdValidation, 'params'),
  validateRequest(updateCustomerValidation),
  updateCustomer
);

// @route   DELETE /api/customers/:id
// @desc    Delete customer
// @access  Private
router.delete(
  '/:id',
  validateRequest(customerIdValidation, 'params'),
  deleteCustomer
);

// @route   POST /api/customers/:id/contacts
// @desc    Add contact person to customer
// @access  Private
router.post(
  '/:id/contacts',
  validateRequest(customerIdValidation, 'params'),
  addContactPerson
);

// @route   PATCH /api/customers/:id/contacts/:contactId
// @desc    Update contact person
// @access  Private
router.patch(
  '/:id/contacts/:contactId',
  validateRequest(customerIdValidation, 'params'),
  updateContactPerson
);

// @route   DELETE /api/customers/:id/contacts/:contactId
// @desc    Delete contact person from customer
// @access  Private
router.delete(
  '/:id/contacts/:contactId',
  validateRequest(customerIdValidation, 'params'),
  deleteContactPerson
);

// @route   POST /api/customers/:id/retry-sync
// @desc    Retry AccountGST sync for customer
// @access  Private
router.post(
  '/:id/retry-sync',
  validateRequest(customerIdValidation, 'params'),
  retrySync
);

export default router;