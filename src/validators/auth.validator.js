import { body, param } from 'express-validator';

// User registration validation
export const registerValidator = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['user', 'admin']).withMessage('Role must be either user or admin')
];

// User login validation
export const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

// Update profile validation
export const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail()
];

// Change password validation
export const changePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];