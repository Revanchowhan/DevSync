require('dotenv').config();

const { validateConfig } = require('./utils/config');

const check = validateConfig();
if (!check.valid) {
  // eslint-disable-next-line no-console
  console.error(check.message);
  process.exit(1);
}

const { connectDB } = require('./dbConnect');
const app = require('./app');

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`[server] DevSync API listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[server] failed to start:', err);
    process.exit(1);
  });

module.exports = app;
