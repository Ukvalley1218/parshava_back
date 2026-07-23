import Joi from 'joi';

// Create enquiry validation
export const createEnquiryValidation = Joi.object({
  customerId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid customer ID format',
      'any.required': 'Customer ID is required'
    }),
  contactPerson: Joi.object({
    name: Joi.string().allow(''),
    designation: Joi.string().allow(''),
    mobile: Joi.string().allow(''),
    email: Joi.string().allow(''),
    isPrimary: Joi.boolean(),
    isWhatsApp: Joi.boolean()
  }).allow(null).optional(),
  description: Joi.string()
    .required()
    .trim()
    .min(1)
    .max(2000)
    .messages({
      'string.empty': 'Description is required',
      'any.required': 'Description is required',
      'string.max': 'Description cannot exceed 2000 characters'
    })
});

// Update enquiry validation
export const updateEnquiryValidation = Joi.object({
  description: Joi.string()
    .trim()
    .min(1)
    .max(2000)
    .messages({
      'string.empty': 'Description cannot be empty',
      'string.max': 'Description cannot exceed 2000 characters'
    }),
  status: Joi.string()
    .valid('open', 'in_progress', 'quoted', 'closed')
    .messages({
      'any.only': 'Status must be one of: open, in_progress, quoted, closed'
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
  }).allow(null).optional(),
  assignedTo: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid user ID format'
    })
});

// Enquiry ID validation
export const enquiryIdValidation = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid enquiry ID format',
      'any.required': 'Enquiry ID is required'
    })
});

// Link quotation validation
export const linkQuotationValidation = Joi.object({
  quotationId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid quotation ID format',
      'any.required': 'Quotation ID is required'
    })
});