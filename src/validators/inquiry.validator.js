import Joi from 'joi';

// Create inquiry validation schema
export const createInquiryValidation = Joi.object({
  customerId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid customer ID format',
      'any.required': 'Customer ID is required'
    })
});

// Add product validation schema
export const addProductValidation = Joi.object({
  productId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid product ID format',
      'any.required': 'Product ID is required'
    }),
  qty: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.min': 'Quantity must be at least 1',
      'any.required': 'Quantity is required'
    }),
  discount: Joi.number()
    .min(0)
    .default(0)
    .messages({
      'number.base': 'Discount must be a number',
      'number.min': 'Discount cannot be negative'
    })
});

// Update product validation schema
export const updateProductValidation = Joi.object({
  productId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid product ID format',
      'any.required': 'Product ID is required'
    }),
  qty: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.min': 'Quantity must be at least 1',
      'any.required': 'Quantity is required'
    }),
  discount: Joi.number()
    .min(0)
    .default(0)
    .messages({
      'number.base': 'Discount must be a number',
      'number.min': 'Discount cannot be negative'
    })
});

// Inquiry ID validation
export const inquiryIdValidation = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid inquiry ID format',
      'any.required': 'Inquiry ID is required'
    })
});

// Update inquiry validation schema
export const updateInquiryValidation = Joi.object({
  status: Joi.string()
    .valid('draft', 'converted', 'cancelled')
    .messages({
      'any.only': 'Status must be one of: draft, converted, cancelled'
    })
});

// Remove product validation (for params)
export const removeProductValidation = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid inquiry ID format',
      'any.required': 'Inquiry ID is required'
    }),
  productId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid product ID format',
      'any.required': 'Product ID is required'
    })
});

// ============================================
// CART VALIDATION SCHEMAS
// ============================================

// Add to cart validation
export const addToCartValidation = Joi.object({
  productId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid product ID format',
      'any.required': 'Product ID is required'
    }),
  qty: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Quantity must be a number',
      'number.min': 'Quantity must be at least 1'
    }),
  discount: Joi.number()
    .min(0)
    .default(0)
    .messages({
      'number.base': 'Discount must be a number',
      'number.min': 'Discount cannot be negative'
    })
});

// Update cart item validation (params)
export const updateCartItemValidation = Joi.object({
  productId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid product ID format',
      'any.required': 'Product ID is required'
    })
});

// Update cart item body validation
export const updateCartItemBodyValidation = Joi.object({
  qty: Joi.number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'Quantity must be a number',
      'number.min': 'Quantity must be at least 1'
    }),
  discount: Joi.number()
    .min(0)
    .messages({
      'number.base': 'Discount must be a number',
      'number.min': 'Discount cannot be negative'
    })
});

// Submit cart validation
export const submitCartValidation = Joi.object({
  customerId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid customer ID format',
      'any.required': 'Customer ID is required'
    }),
  notes: Joi.string()
    .allow('')
    .max(500)
    .messages({
      'string.max': 'Notes cannot exceed 500 characters'
    }),
  contactPerson: Joi.object({
    name: Joi.string().allow(''),
    designation: Joi.string().allow(''),
    mobile: Joi.string().allow(''),
    email: Joi.string().allow(''),
    isPrimary: Joi.boolean(),
    isWhatsApp: Joi.boolean()
  }).allow(null).optional()
});

// Assign inquiry validation
export const assignInquiryValidation = Joi.object({
  assignedToUserId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid user ID format',
      'any.required': 'User ID is required'
    })
});

// ============================================
// QUOTATION CART VALIDATION SCHEMAS
// ============================================

// Create quotation cart validation
export const createQuotationCartValidation = Joi.object({
  customerId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid customer ID format',
      'any.required': 'Customer ID is required'
    })
});

// Add product to quotation cart validation
export const addQuotationCartProductValidation = Joi.object({
  productId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid product ID format',
      'any.required': 'Product ID is required'
    }),
  qty: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Quantity must be a number',
      'number.min': 'Quantity must be at least 1'
    }),
  discount: Joi.number()
    .min(0)
    .default(0)
    .messages({
      'number.base': 'Discount must be a number',
      'number.min': 'Discount cannot be negative'
    })
});

// Update quotation cart item validation (body)
export const updateQuotationCartItemValidation = Joi.object({
  qty: Joi.number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'Quantity must be a number',
      'number.min': 'Quantity must be at least 1'
    }),
  discount: Joi.number()
    .min(0)
    .messages({
      'number.base': 'Discount must be a number',
      'number.min': 'Discount cannot be negative'
    })
});

// Submit quotation validation
export const submitQuotationValidation = Joi.object({
  notes: Joi.string()
    .allow('')
    .max(500)
    .messages({
      'string.max': 'Notes cannot exceed 500 characters'
    }),
  contactPerson: Joi.object({
    name: Joi.string().allow(''),
    designation: Joi.string().allow(''),
    mobile: Joi.string().allow(''),
    email: Joi.string().allow(''),
    isPrimary: Joi.boolean(),
    isWhatsApp: Joi.boolean()
  }).allow(null).optional()
});

// Quotation cart params validation (id + productId)
export const quotationCartParamsValidation = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid quotation ID format',
      'any.required': 'Quotation ID is required'
    }),
  productId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid product ID format',
      'any.required': 'Product ID is required'
    })
});