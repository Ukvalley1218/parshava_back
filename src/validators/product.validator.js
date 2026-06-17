import Joi from 'joi';

// Product query validation schema
export const validateProductQuery = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(10)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  search: Joi.string()
    .trim()
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Search term cannot exceed 200 characters'
    }),
  brand: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Brand cannot exceed 100 characters'
    }),
  category: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Category cannot exceed 100 characters'
    }),
  subcategory: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Subcategory cannot exceed 100 characters'
    }),
  series: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Series cannot exceed 100 characters'
    }),
  subSeries: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Sub-series cannot exceed 100 characters'
    })
});

// Product ID validation
export const productIdValidation = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid product ID format',
      'any.required': 'Product ID is required'
    })
});

// Create product validation schema
export const createProductValidation = Joi.object({
  name: Joi.string()
    .trim()
    .max(200)
    .required()
    .messages({
      'string.empty': 'Product name is required',
      'string.max': 'Product name cannot exceed 200 characters',
      'any.required': 'Product name is required'
    }),
  partNumber: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'partNumber cannot exceed 50 characters'
    }),
  brand: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Brand cannot exceed 100 characters'
    }),
  category: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Category cannot exceed 100 characters'
    }),
  description: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
  price: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Price cannot be negative'
    }),
  mop: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'MOP cannot be negative'
    }),
  nlc: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'NLC cannot be negative'
    }),
  gstRate: Joi.number()
    .min(0)
    .max(100)
    .optional()
    .messages({
      'number.min': 'GST rate cannot be negative',
      'number.max': 'GST rate cannot exceed 100'
    }),
  hsn: Joi.string()
    .trim()
    .max(10)
    .optional()
    .allow('')
    .messages({
      'string.max': 'HSN cannot exceed 10 characters'
    }),
  unit: Joi.string()
    .trim()
    .max(20)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Unit cannot exceed 20 characters'
    }),
  stock: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Stock cannot be negative'
    }),
  boxSize: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Box size cannot exceed 100 characters'
    }),
  procurement: Joi.string()
    .trim()
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Procurement cannot exceed 200 characters'
    })
});

// Update product validation schema
export const updateProductValidation = Joi.object({
  name: Joi.string()
    .trim()
    .max(200)
    .optional()
    .messages({
      'string.empty': 'Product name cannot be empty',
      'string.max': 'Product name cannot exceed 200 characters'
    }),
  partNumber: Joi.string()
    .trim()
    .max(50)
    .optional()
    .allow('')
    .messages({
      'string.max': 'partNumber cannot exceed 50 characters'
    }),
  brand: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Brand cannot exceed 100 characters'
    }),
  category: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Category cannot exceed 100 characters'
    }),
  description: Joi.string()
    .trim()
    .max(1000)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Description cannot exceed 1000 characters'
    }),
  price: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Price cannot be negative'
    }),
  mop: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'MOP cannot be negative'
    }),
  nlc: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'NLC cannot be negative'
    }),
  gstRate: Joi.number()
    .min(0)
    .max(100)
    .optional()
    .messages({
      'number.min': 'GST rate cannot be negative',
      'number.max': 'GST rate cannot exceed 100'
    }),
  hsn: Joi.string()
    .trim()
    .max(10)
    .optional()
    .allow('')
    .messages({
      'string.max': 'HSN cannot exceed 10 characters'
    }),
  unit: Joi.string()
    .trim()
    .max(20)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Unit cannot exceed 20 characters'
    }),
  stock: Joi.number()
    .min(0)
    .optional()
    .messages({
      'number.min': 'Stock cannot be negative'
    }),
  boxSize: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Box size cannot exceed 100 characters'
    }),
  procurement: Joi.string()
    .trim()
    .max(200)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Procurement cannot exceed 200 characters'
    })
});