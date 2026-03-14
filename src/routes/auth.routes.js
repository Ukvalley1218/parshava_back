import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';

const router = express.Router();

// Validation rules
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  validate
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate
];

const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please enter a valid email'),
  validate
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  validate
];

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfileValidation, updateProfile);
router.put('/change-password', protect, changePasswordValidation, changePassword);

export default router;