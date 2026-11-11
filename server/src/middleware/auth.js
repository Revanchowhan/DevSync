const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'hackmate-dev-secret-change-me';

function signToken(user) {
  return jwt.sign({ id: user._id.toString(), role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

function extractToken(req) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) return token;
  return null;
}

// Any logged-in user. Sets req.user = { id, role }.
function requireAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Like requireAuth, but never fails — populates req.user only when a valid
// token is present. Used for public listings that enrich data for students.
function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.user = { id: payload.id, role: payload.role };
    } catch (err) {
      // ignore invalid tokens on optional routes
    }
  }
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (req.user.role !== role) {
      return res.status(403).json({ error: `Access restricted to ${role}s` });
    }
    return next();
  };
}

// Host gate checked against the database (not just the JWT), so a host who
// was rejected/revoked is blocked immediately even with a still-valid token,
// and pending hosts can never mutate hackathon data.
async function requireApprovedHost(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  if (req.user.role !== 'host') {
    return res.status(403).json({ error: 'Access restricted to hosts' });
  }
  try {
    // Required lazily to avoid a model/middleware load cycle.
    // eslint-disable-next-line global-require
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('hostStatus');
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    if (user.hostStatus !== 'approved') {
      return res.status(403).json({
        error:
          user.hostStatus === 'pending'
            ? 'Your host account is pending admin approval.'
            : 'Your host account was not approved. Please contact the admin.',
      });
    }
    return next();
  } catch (err) {
    return next(err);
  }
}

// Admin gate (host approver), also checked against the database.
async function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required' });
  try {
    // eslint-disable-next-line global-require
    const User = require('../models/User');
    const user = await User.findById(req.user.id).select('isAdmin');
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Access restricted to admins' });
    }
    req.adminUser = user;
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = { signToken, requireAuth, optionalAuth, requireRole, requireApprovedHost, requireAdmin };
