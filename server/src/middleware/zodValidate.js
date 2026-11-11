const { z } = require('zod');

/**
 * Validate request using Zod schemas
 * @param {Object} schemas - { body?: z.ZodSchema, query?: z.ZodSchema, params?: z.ZodSchema }
 */
function zodValidate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const details = err.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
          code: i.code,
        }));
        return res.status(400).json({
          error: details[0]?.message || 'Validation failed',
          details,
        });
      }
      next(err);
    }
  };
}

module.exports = { zodValidate };
