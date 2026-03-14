import Joi from 'joi';

// Create customer validation schema
export const createCustomerValidation = Joi.object({
  name: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
  mobile: Joi.string()
    .trim()
    .max(15)
    .required()
    .messages({
      'string.empty': 'Mobile number is required',
      'string.max': 'Mobile number cannot exceed 15 characters',
      'any.required': 'Mobile number is required'
    }),
  email: Joi.string()
    .trim()
    .email()
    .allow('')
    .optional()
    .messages({
      'string.email': 'Please enter a valid email'
    }),
  address: Joi.string()
    .trim()
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Address cannot exceed 200 characters'
    }),
  city: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'City cannot exceed 50 characters'
    }),
  state: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'State cannot exceed 50 characters'
    }),
  pincode: Joi.string()
    .trim()
    .max(10)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Pincode cannot exceed 10 characters'
    }),
  gstin: Joi.string()
    .trim()
    .max(15)
    .optional()
    .allow('')
    .messages({
      'string.max': 'GSTIN cannot exceed 15 characters'
    })
});

// Update customer validation schema
export const updateCustomerValidation = Joi.object({
  name: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Name cannot be empty',
      'string.max': 'Name cannot exceed 100 characters'
    }),
  mobile: Joi.string()
    .trim()
    .max(15)
    .optional()
    .messages({
      'string.empty': 'Mobile number cannot be empty',
      'string.max': 'Mobile number cannot exceed 15 characters'
    }),
  email: Joi.string()
    .trim()
    .email()
    .allow('')
    .optional()
    .messages({
      'string.email': 'Please enter a valid email'
    }),
  address: Joi.string()
    .trim()
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Address cannot exceed 200 characters'
    }),
  city: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'City cannot exceed 50 characters'
    }),
  state: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'State cannot exceed 50 characters'
    }),
  pincode: Joi.string()
    .trim()
    .max(10)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Pincode cannot exceed 10 characters'
    }),
  gstin: Joi.string()
    .trim()
    .max(15)
    .optional()
    .allow('')
    .messages({
      'string.max': 'GSTIN cannot exceed 15 characters'
    }),
  outstanding: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Outstanding cannot be negative'
    })
});

// Customer ID validation
export const customerIdValidation = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid customer ID format',
      'any.required': 'Customer ID is required'
    })
});