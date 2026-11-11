const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');

// Schema for Mongo-backed TTL rate limiting
const RateLimitRecordSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    totalHits: { type: Number, default: 0 },
    resetTime: { type: Date, required: true },
  },
  { _id: false, versionKey: false }
);

// TTL index ensures Mongo automatically deletes expired windows
RateLimitRecordSchema.index({ resetTime: 1 }, { expireAfterSeconds: 0 });

let RateLimitRecord;
try {
  RateLimitRecord = mongoose.model('RateLimitRecord');
} catch (e) {
  RateLimitRecord = mongoose.model('RateLimitRecord', RateLimitRecordSchema);
}

class MongoStore {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000;
    this.prefix = options.prefix || 'rl:';
  }

  init(options) {
    if (options && options.windowMs) {
      this.windowMs = options.windowMs;
    }
  }

  async increment(key) {
    const fullKey = `${this.prefix}${key}`;
    const now = new Date();
    const fallbackReset = new Date(now.getTime() + this.windowMs);

    // If mongoose is not connected yet, return in-memory-like response
    if (mongoose.connection.readyState !== 1) {
      return { totalHits: 1, resetTime: fallbackReset };
    }

    try {
      // Find existing or insert with resetTime
      const doc = await RateLimitRecord.findOneAndUpdate(
        { _id: fullKey, resetTime: { $gt: now } },
        {
          $inc: { totalHits: 1 },
          $setOnInsert: { resetTime: fallbackReset },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return {
        totalHits: doc.totalHits,
        resetTime: doc.resetTime,
      };
    } catch (err) {
      // If a race condition occurred on upsert or Mongo error, fallback safely
      return { totalHits: 1, resetTime: fallbackReset };
    }
  }

  async decrement(key) {
    const fullKey = `${this.prefix}${key}`;
    if (mongoose.connection.readyState === 1) {
      try {
        await RateLimitRecord.updateOne(
          { _id: fullKey, totalHits: { $gt: 0 } },
          { $inc: { totalHits: -1 } }
        );
      } catch (err) {
        // silent
      }
    }
  }

  async resetKey(key) {
    const fullKey = `${this.prefix}${key}`;
    if (mongoose.connection.readyState === 1) {
      try {
        await RateLimitRecord.deleteOne({ _id: fullKey });
      } catch (err) {
        // silent
      }
    }
  }

  async resetAll() {
    if (mongoose.connection.readyState === 1) {
      try {
        await RateLimitRecord.deleteMany({ _id: new RegExp(`^${this.prefix}`) });
      } catch (err) {
        // silent
      }
    }
  }
}

function createLimiter({ windowMs, max, prefix, message, keyGenerator }) {
  const store = new MongoStore({ windowMs, prefix });
  return rateLimit({
    windowMs,
    max,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    store,
    keyGenerator: keyGenerator || ((req) => req.ip),
    handler: (req, res) => {
      res.status(429).json({
        error: message || 'Too many requests, please try again later.',
      });
    },
  });
}

// 1. General auth limiter (IP based) - 300 req / 15 min
const authGeneralLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  prefix: 'auth_gen:',
  message: 'Too many authentication attempts, please try again later.',
});

// 2. Strict login limiter (IP + email if provided) - 10 attempts per 15 min
const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  prefix: 'login:',
  keyGenerator: (req) => `${req.ip}_${(req.body && req.body.email ? req.body.email.trim().toLowerCase() : '')}`,
  message: 'Too many login attempts. Please wait 15 minutes before trying again.',
});

// 3. Stricter connection requests limiter - 25 per hour per user
const connectionRequestLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 25,
  prefix: 'conn_req:',
  keyGenerator: (req) => (req.user ? req.user.id : req.ip),
  message: 'Connection request limit reached. Please wait before sending more.',
});

// 4. Stricter message limiter - 60 per minute per user
const messageLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 60,
  prefix: 'msg:',
  keyGenerator: (req) => (req.user ? req.user.id : req.ip),
  message: 'You are sending messages too quickly. Please slow down.',
});

// 5. Stricter report limiter - 5 per hour per user
const reportLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  prefix: 'report:',
  keyGenerator: (req) => (req.user ? req.user.id : req.ip),
  message: 'Report submission limit reached. Please wait before submitting more reports.',
});

module.exports = {
  MongoStore,
  createLimiter,
  authGeneralLimiter,
  loginLimiter,
  connectionRequestLimiter,
  messageLimiter,
  reportLimiter,
};
