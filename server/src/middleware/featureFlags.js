function isFeatureEnabled(featureName) {
  const envKey = featureName.startsWith('FEATURE_')
    ? featureName
    : `FEATURE_${featureName.toUpperCase()}`;
  const envVal = process.env[envKey] || process.env[featureName];
  if (envVal === 'false' || envVal === '0') return false;
  if (envVal === 'true' || envVal === '1') return true;
  // Default to true for ideas and messaging in local dev/testing unless explicitly disabled
  if (envKey === 'FEATURE_IDEAS' || envKey === 'FEATURE_MESSAGING') return true;
  return false;
}

function requireFeature(featureName) {
  return (req, res, next) => {
    if (!isFeatureEnabled(featureName)) {
      return res.status(404).json({ error: 'Feature not found or disabled' });
    }
    next();
  };
}

module.exports = {
  isFeatureEnabled,
  requireFeature,
};
