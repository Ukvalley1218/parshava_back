import Joi from 'joi';

// Notification ID validation
export const notificationIdValidation = Joi.object({
  id: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid notification ID format',
      'any.required': 'Notification ID is required'
    })
});