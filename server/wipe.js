/* eslint-disable no-console */
// DevSync wipe script — deletes ALL documents in the dev database without reseeding.
if (process.env.NODE_ENV === 'production') {
  console.error('[wipe] Refusing to wipe database in production environment.');
  process.exit(1);
}

//
//   npm run wipe
//
// WARNING: irreversible against whatever database MONGODB_URI points at.
// Confirm the target is the Atlas 'hackmate' cluster before running.
const { connectDB, disconnectDB } = require('./src/dbConnect');
const User = require('./src/models/User');
const Hackathon = require('./src/models/Hackathon');
const Team = require('./src/models/Team');
const TeamRequest = require('./src/models/TeamRequest');
const Announcement = require('./src/models/Announcement');
const Notification = require('./src/models/Notification');

async function main() {
  await connectDB();
  const counts = await Promise.all([
    User.countDocuments(),
    Hackathon.countDocuments(),
    Team.countDocuments(),
    TeamRequest.countDocuments(),
    Announcement.countDocuments(),
    Notification.countDocuments(),
  ]);
  console.log('[wipe] before:', {
    users: counts[0],
    hackathons: counts[1],
    teams: counts[2],
    teamRequests: counts[3],
    announcements: counts[4],
    notifications: counts[5],
  });

  if (process.env.WIPE_CONFIRM !== 'yes') {
    console.error('[wipe] aborted — set WIPE_CONFIRM=yes to proceed.');
    await disconnectDB();
    process.exit(1);
  }

  console.log('[wipe] deleting everything…');
  await Promise.all([
    User.deleteMany({}),
    Hackathon.deleteMany({}),
    Team.deleteMany({}),
    TeamRequest.deleteMany({}),
    Announcement.deleteMany({}),
    Notification.deleteMany({}),
  ]);
  console.log('[wipe] done. Database is empty.');
  await disconnectDB();
  process.exit(0);
}

main().catch(async (err) => {
  console.error('[wipe] failed:', err);
  await disconnectDB();
  process.exit(1);
});
