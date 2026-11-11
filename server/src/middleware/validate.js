const { validationResult } = require('express-validator');

// Runs a list of express-validator chains, then responds 400 with
// { error, details } when any check fails.
function validate(validations) {
  return async (req, res, next) => {
    await Promise.all(validations.map((v) => v.run(req)));
    const result = validationResult(req);
    if (result.isEmpty()) return next();
    const details = result.array().map((e) => ({
      field: e.path || e.param,
      message: e.msg,
    }));
    return res.status(400).json({ error: 'Validation failed', details });
  };
}

module.exports = { validate };
