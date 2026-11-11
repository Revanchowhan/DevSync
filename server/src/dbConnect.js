const fs = require('fs');
const os = require('os');
const path = require('path');
const mongoose = require('mongoose');

const LOCAL_URI = 'mongodb://127.0.0.1:27017/devsync';
const MEMORY_DBPATH = path.join(os.homedir(), '.cache', 'devsync-mongo');

let memoryServer = null;
let migrationsDone = false;

// One-time, idempotent migrations that run after a successful connect
async function runMigrations() {
  if (migrationsDone) return;
  migrationsDone = true;

  try {
    const Team = require('./models/Team');
    const TeamRequest = require('./models/TeamRequest');
    const { generateUniqueJoinCode } = require('./utils/joinCode');

    // Drop the old dedup index if present
    try {
      await TeamRequest.collection.dropIndex('team_1_toUser_1');
    } catch (err) {
      // index already dropped or not present
    }

    // Backfill joinCode on teams created before invite codes existed.
    const missing = await Team.find({
      $or: [{ joinCode: { $exists: false } }, { joinCode: null }],
    }).select('_id');
    for (const team of missing) {
      team.joinCode = await generateUniqueJoinCode(Team);
      await team.save();
    }
    if (missing.length) {
      // eslint-disable-next-line no-console
      console.log(`[db] backfilled joinCode for ${missing.length} team(s)`);
    }

    const User = require('./models/User');
    const backfilled = await User.updateMany(
      { $or: [{ hostStatus: { $exists: false } }, { hostStatus: null }] },
      { $set: { hostStatus: 'approved' } }
    );
    if (backfilled.modifiedCount) {
      // eslint-disable-next-line no-console
      console.log(`[db] backfilled hostStatus=approved for ${backfilled.modifiedCount} user(s)`);
    }

    const defaultAdmin = process.env.NODE_ENV === 'production' ? '' : 'admin@devsync.demo';
    const adminEmails = (process.env.ADMIN_EMAILS || defaultAdmin)
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);
    if (adminEmails.length) {
      await User.updateMany(
        { email: { $in: adminEmails } },
        { $set: { isAdmin: true, hostStatus: 'approved' } }
      );
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[db] migration error:', err.message);
  }
}

async function tryConnect(label, uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 3000 });
  // eslint-disable-next-line no-console
  console.log(`[db] connected (${label})`);
  await runMigrations();
}

async function connectDB() {
  // 1. Serverless DB: cache the Mongoose connection on globalThis so serverless invocations reuse it
  if (globalThis._mongooseConnection && mongoose.connection.readyState === 1) {
    return globalThis._mongooseConnection;
  }

  const isProd = process.env.NODE_ENV === 'production';
  const candidates = [];

  if (process.env.MONGODB_URI) {
    candidates.push(['MONGODB_URI env', process.env.MONGODB_URI]);
  }

  if (!isProd) {
    candidates.push(['local default mongodb://127.0.0.1:27017/devsync', LOCAL_URI]);
  }

  for (const [label, uri] of candidates) {
    try {
      await tryConnect(label, uri);
      globalThis._mongooseConnection = mongoose.connection;
      return mongoose.connection;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(`[db] ${label} unavailable: ${err.message}`);
    }
  }

  if (isProd) {
    throw new Error('MONGODB_URI is required and could not connect in production.');
  }

  // Final fallback for local dev only: in-memory MongoDB
  // eslint-disable-next-line no-console
  console.log('[db] falling back to mongodb-memory-server (development only)…');
  const { MongoMemoryServer } = require('mongodb-memory-server');
  fs.mkdirSync(MEMORY_DBPATH, { recursive: true });
  memoryServer = await MongoMemoryServer.create({ instance: { dbPath: MEMORY_DBPATH } });
  await tryConnect('mongodb-memory-server (in-memory)', memoryServer.getUri());
  globalThis._mongooseConnection = mongoose.connection;
  return mongoose.connection;
}

async function disconnectDB() {
  await mongoose.disconnect();
  globalThis._mongooseConnection = null;
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}

module.exports = { connectDB, disconnectDB };
