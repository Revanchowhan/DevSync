// Production configuration validator
function validateConfig() {
  const isProd = process.env.NODE_ENV === 'production';
  const errors = [];

  if (isProd) {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-me') {
      errors.push('JWT_SECRET must be securely set and cannot be "change-me" in production.');
    }
    if (!process.env.MONGODB_URI) {
      errors.push('MONGODB_URI is required in production (no in-memory database allowed).');
    }
    if (!process.env.ADMIN_EMAILS || !process.env.ADMIN_EMAILS.trim()) {
      errors.push('ADMIN_EMAILS must be explicitly set in production.');
    }
  }

  if (errors.length > 0) {
    const message = `[FATAL] Invalid production configuration:\n - ${errors.join('\n - ')}`;
    return { valid: false, message, errors };
  }

  return { valid: true };
}

module.exports = { validateConfig };
