// Vercel serverless entry for the DevSync API.
const { validateConfig } = require('../server/src/utils/config');
const { connectDB } = require('../server/src/dbConnect');
const app = require('../server/src/app');

let ready = null;
const ensureDb = () => {
  const check = validateConfig();
  if (!check.valid) {
    throw new Error(check.message);
  }
  if (!ready) {
    ready = connectDB().catch((err) => {
      ready = null;
      throw err;
    });
  }
  return ready;
};

module.exports = async (req, res) => {
  try {
    await ensureDb();
    return app(req, res);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[api] DB connection or startup failed:', err && err.message);
    res.status(503).json({ error: 'Database unavailable or configuration error, please try again.' });
  }
};
