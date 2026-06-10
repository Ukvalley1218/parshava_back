import Joi from 'joi';

// Create customer validation schema
export const createCustomerValidation = Joi.object({
  // Mandatory fields
  name: Joi.string()
    .trim()
    .max(100)
    .required()
    .messages({
      'string.empty': 'Contact name is required',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Contact name is required'
    }),
  firmName: Joi.string()
    .trim()
    .max(150)
    .required()
    .messages({
      'string.empty': 'Firm name is required',
      'string.max': 'Firm name cannot exceed 150 characters',
      'any.required': 'Firm name is required'
    }),
  mobile: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      'string.empty': 'Mobile number is required',
      'string.pattern.base': 'Enter valid 10-digit mobile number starting with 6-9',
      'any.required': 'Mobile number is required'
    }),
  address: Joi.string()
    .trim()
    .max(300)
    .required()
    .messages({
      'string.empty': 'Address is required',
      'string.max': 'Address cannot exceed 300 characters',
      'any.required': 'Address is required'
    }),
  city: Joi.string()
    .trim()
    .max(50)
    .required()
    .messages({
      'string.empty': 'City is required',
      'string.max': 'City cannot exceed 50 characters',
      'any.required': 'City is required'
    }),
  state: Joi.string()
    .trim()
    .max(50)
    .required()
    .messages({
      'string.empty': 'State is required',
      'string.max': 'State cannot exceed 50 characters',
      'any.required': 'State is required'
    }),
  pincode: Joi.string()
    .trim()
    .length(6)
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      'string.empty': 'Pincode is required',
      'string.length': 'Pincode must be 6 digits',
      'string.pattern.base': 'Enter valid 6-digit pincode',
      'any.required': 'Pincode is required'
    }),
  email: Joi.string()
    .trim()
    .email()
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email',
      'any.required': 'Email is required'
    }),
  country: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Country is required',
      'any.required': 'Country is required'
    }),
  panNumber: Joi.string()
    .trim()
    .length(10)
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .required()
    .messages({
      'string.empty': 'PAN number is required',
      'string.length': 'PAN must be 10 characters',
      'string.pattern.base': 'Enter valid PAN (10 characters)',
      'any.required': 'PAN number is required'
    }),
  aadharNumber: Joi.string()
    .trim()
    .length(12)
    .pattern(/^\d{12}$/)
    .required()
    .messages({
      'string.empty': 'Aadhar number is required',
      'string.length': 'Aadhar number must be 12 digits',
      'string.pattern.base': 'Enter valid 12-digit Aadhar number',
      'any.required': 'Aadhar number is required'
    }),
  shopActNumber: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Shop Act number is required',
      'any.required': 'Shop Act number is required'
    }),
  msmeNumber: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'MSME number is required',
      'any.required': 'MSME number is required'
    }),
  priceListCategory: Joi.string()
    .valid('T1', 'T2', 'T3', 'T4')
    .required()
    .messages({
      'any.only': 'Price list must be T1, T2, T3, or T4',
      'any.required': 'Price list is required'
    }),
  customerType: Joi.string()
    .valid('customer', 'dealer', 'distributor', 'retailer')
    .required()
    .messages({
      'any.only': 'Invalid customer type',
      'any.required': 'Customer type is required'
    }),
  customerStatus: Joi.string()
    .valid('active', 'inactive', 'blocked')
    .required()
    .messages({
      'any.only': 'Invalid customer status',
      'any.required': 'Customer status is required'
    }),
  accountManager: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Account manager is required',
      'any.required': 'Account manager is required'
    }),
  productManager: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Product manager is required',
      'any.required': 'Product manager is required'
    }),
  leadSource: Joi.string()
    .trim()
    .required()
    .messages({
      'string.empty': 'Lead source is required',
      'any.required': 'Lead source is required'
    }),

  // Optional fields
  softwareId: Joi.string()
    .trim()
    .allow('')
    .optional(),
  designation: Joi.string()
    .trim()
    .allow('')
    .optional(),
  landmark: Joi.string()
    .trim()
    .allow('')
    .optional(),
  googleLocation: Joi.string()
    .trim()
    .allow('')
    .optional(),
  mobile2: Joi.string()
    .trim()
    .allow('')
    .optional(),
  mobile2Whatsapp: Joi.boolean().optional(),
  mobile3: Joi.string()
    .trim()
    .allow('')
    .optional(),
  mobile3Whatsapp: Joi.boolean().optional(),
  isWhatsApp: Joi.boolean().optional(),
  landline: Joi.string()
    .trim()
    .allow('')
    .optional(),

  // Business Documents (Optional)
  gstin: Joi.string()
    .trim()
    .max(15)
    .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'Enter valid GSTIN (15 characters)',
      'string.max': 'GSTIN cannot exceed 15 characters'
    }),
  documents: Joi.array().optional(),

  // Categories (Optional)
  businessCategory: Joi.string()
    .allow('')
    .optional(),
  brandCategory: Joi.string()
    .allow('')
    .optional(),

  // Other optional fields
  notes: Joi.string()
    .trim()
    .allow('')
    .optional(),
  firmPhoto: Joi.string().allow('').optional(),
  customerPhoto: Joi.string().allow('').optional()
});

// Update customer validation schema
export const updateCustomerValidation = Joi.object({
  // All fields optional for update, but validated if provided
  name: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.empty': 'Name cannot be empty',
      'string.max': 'Name cannot exceed 100 characters'
    }),
  firmName: Joi.string()
    .trim()
    .max(150)
    .optional()
    .messages({
      'string.empty': 'Firm name cannot be empty',
      'string.max': 'Firm name cannot exceed 150 characters'
    }),
  mobile: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .optional()
    .messages({
      'string.empty': 'Mobile number cannot be empty',
      'string.pattern.base': 'Enter valid 10-digit mobile number'
    }),
  address: Joi.string()
    .trim()
    .max(300)
    .optional()
    .messages({
      'string.max': 'Address cannot exceed 300 characters'
    }),
  city: Joi.string()
    .trim()
    .max(50)
    .optional()
    .messages({
      'string.max': 'City cannot exceed 50 characters'
    }),
  state: Joi.string()
    .trim()
    .max(50)
    .optional()
    .messages({
      'string.max': 'State cannot exceed 50 characters'
    }),
  pincode: Joi.string()
    .trim()
    .length(6)
    .pattern(/^\d{6}$/)
    .optional()
    .messages({
      'string.length': 'Pincode must be 6 digits',
      'string.pattern.base': 'Enter valid 6-digit pincode'
    }),
  email: Joi.string()
    .trim()
    .email()
    .optional()
    .messages({
      'string.email': 'Please enter a valid email'
    }),
  country: Joi.string()
    .trim()
    .optional(),
  panNumber: Joi.string()
    .trim()
    .length(10)
    .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
    .optional()
    .messages({
      'string.length': 'PAN must be 10 characters',
      'string.pattern.base': 'Enter valid PAN (10 characters)'
    }),
  aadharNumber: Joi.string()
    .trim()
    .length(12)
    .pattern(/^\d{12}$/)
    .optional()
    .messages({
      'string.length': 'Aadhar number must be 12 digits',
      'string.pattern.base': 'Enter valid 12-digit Aadhar number'
    }),
  shopActNumber: Joi.string()
    .trim()
    .optional(),
  msmeNumber: Joi.string()
    .trim()
    .optional(),
  priceListCategory: Joi.string()
    .valid('T1', 'T2', 'T3', 'T4')
    .optional()
    .messages({
      'any.only': 'Price list must be T1, T2, T3, or T4'
    }),
  customerType: Joi.string()
    .valid('customer', 'dealer', 'distributor', 'retailer')
    .optional()
    .messages({
      'any.only': 'Invalid customer type'
    }),
  customerStatus: Joi.string()
    .valid('active', 'inactive', 'blocked')
    .optional()
    .messages({
      'any.only': 'Invalid customer status'
    }),
  accountManager: Joi.string()
    .trim()
    .optional(),
  productManager: Joi.string()
    .trim()
    .optional(),
  leadSource: Joi.string()
    .trim()
    .optional(),
  softwareId: Joi.string()
    .trim()
    .allow('')
    .optional(),
  designation: Joi.string()
    .trim()
    .allow('')
    .optional(),
  landmark: Joi.string()
    .trim()
    .allow('')
    .optional(),
  googleLocation: Joi.string()
    .trim()
    .allow('')
    .optional(),
  mobile2: Joi.string()
    .trim()
    .allow('')
    .optional(),
  mobile2Whatsapp: Joi.boolean().optional(),
  mobile3: Joi.string()
    .trim()
    .allow('')
    .optional(),
  mobile3Whatsapp: Joi.boolean().optional(),
  isWhatsApp: Joi.boolean().optional(),
  gstin: Joi.string()
    .trim()
    .max(15)
    .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'Enter valid GSTIN (15 characters)',
      'string.max': 'GSTIN cannot exceed 15 characters'
    }),
  businessCategory: Joi.string()
    .allow('')
    .optional(),
  brandCategory: Joi.string()
    .allow('')
    .optional(),
  notes: Joi.string()
    .trim()
    .allow('')
    .optional(),
  documents: Joi.array().optional(),
  firmPhoto: Joi.string().allow('').optional(),
  customerPhoto: Joi.string().allow('').optional(),
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

// Contact ID validation (includes both customer ID and contact ID)
export const contactIdValidation = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid customer ID format',
      'any.required': 'Customer ID is required'
    }),
  contactId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid contact ID format',
      'any.required': 'Contact ID is required'
    })
});