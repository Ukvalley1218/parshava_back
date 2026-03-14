import Joi from 'joi';

// Create order from inquiry validation schema
export const createOrderValidation = Joi.object({
  inquiryId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid inquiry ID format',
      'any.required': 'Inquiry ID is required'
    })
});

// Update order status validation schema
export const updateStatusValidation = Joi.object({
  status: Joi.string()
    .valid('pending', 'processing', 'completed', 'cancelled')
    .required()
    .messages({
      'any.only': 'Status must be one of: pending, processing, completed, cancelled',
      'any.required': 'Status is required'
    })
});

// Order ID validation
export const orderIdValidation = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid order ID format',
      'any.required': 'Order ID is required'
    })
});