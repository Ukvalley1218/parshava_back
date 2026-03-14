import Joi from 'joi';

// Create scheme validation schema
export const createSchemeValidation = Joi.object({
  title: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.empty': 'Title is required',
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Title is required'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  products: Joi.array()
    .items(Joi.string().pattern(/^[0-9a-fA-F]{24}$/))
    .optional()
    .messages({
      'string.pattern.base': 'Invalid product ID format'
    }),
  discountType: Joi.string()
    .valid('percentage', 'flat')
    .required()
    .messages({
      'any.only': 'Discount type must be either percentage or flat',
      'any.required': 'Discount type is required'
    }),
  discountValue: Joi.number()
    .min(0)
    .required()
    .messages({
      'number.base': 'Discount value must be a number',
      'number.min': 'Discount value cannot be negative',
      'any.required': 'Discount value is required'
    }),
  startDate: Joi.date()
    .required()
    .messages({
      'date.base': 'Invalid start date',
      'any.required': 'Start date is required'
    }),
  endDate: Joi.date()
    .min(Joi.ref('startDate'))
    .required()
    .messages({
      'date.base': 'Invalid end date',
      'date.min': 'End date must be after start date',
      'any.required': 'End date is required'
    })
});

// Update scheme validation schema
export const updateSchemeValidation = Joi.object({
  title: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Title cannot be empty',
      'string.max': 'Title cannot exceed 100 characters'
    }),
  description: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 500 characters'
    }),
  discountValue: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Discount value must be a number',
      'number.min': 'Discount value cannot be negative'
    }),
  status: Joi.string()
    .valid('active', 'inactive', 'expired')
    .optional()
    .messages({
      'any.only': 'Status must be one of: active, inactive, expired'
    }),
  endDate: Joi.date()
    .optional()
    .messages({
      'date.base': 'Invalid end date'
    })
});

// Scheme ID validation
export const schemeIdValidation = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid scheme ID format',
      'any.required': 'Scheme ID is required'
    })
});

// Product ID validation
export const productIdValidation = Joi.object({
  productId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid product ID format',
      'any.required': 'Product ID is required'
    })
});