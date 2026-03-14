/**
 * Middleware to validate request data using Joi schemas
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {String} source - Source of data to validate ('body', 'params', 'query')
 * @returns {Function} Express middleware function
 */
export const validateRequest = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = source === 'params' ? req.params : source === 'query' ? req.query : req.body;

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    // Replace the request data with the validated and sanitized value
    if (source === 'params') {
      req.params = value;
    } else if (source === 'query') {
      req.query = value;
    } else {
      req.body = value;
    }

    next();
  };
};