// Express app only — no side effects (no DB connect, no listen).
// Used by server/src/index.js (local dev) and api/index.js (Vercel serverless).
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');

const { notFound, errorHandler } = require('./middleware/errorHandler');
const { authGeneralLimiter } = require('./utils/rateLimiter');

const app = express();

app.use(helmet());

// CLIENT_ORIGIN may be a comma-separated list in production
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Sanitize user-supplied data to prevent MongoDB Operator Injection
app.use(mongoSanitize());

// Rate-limit auth writes: 300 POSTs per 15 minutes
app.use('/api/auth', (req, res, next) =>
  req.method === 'POST' ? authGeneralLimiter(req, res, next) : next()
);

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'devsync-server' }));

// Public configuration / features status endpoint
app.get('/api/config', (req, res) => {
  res.json({
    features: {
      messaging: process.env.FEATURE_MESSAGING === 'true',
      ideas: process.env.FEATURE_IDEAS === 'true',
    },
  });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/students', require('./routes/students'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/ideas', require('./routes/ideas'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/safety', require('./routes/safety'));
app.use('/api/hackathons', require('./routes/hackathons'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
