/* eslint-disable no-console */
const { connectDB, disconnectDB } = require('../src/dbConnect');
const User = require('../src/models/User');

async function runBackfill() {
  console.log('[backfill] starting user schema backfill...');

  const query = {
    $or: [
      { avatarUrl: { $exists: false } },
      { university: { $exists: false } },
      { interests: { $exists: false } },
      { preferredRoles: { $exists: false } },
      { experienceLevel: { $exists: false } },
      { availability: { $exists: false } },
      { pastProjects: { $exists: false } },
      { achievements: { $exists: false } },
      { profileVisibility: { $exists: false } },
      { onboardingCompleted: { $exists: false } },
      { emailVerified: { $exists: false } },
    ],
  };

  const usersToUpdate = await User.find(query);
  let updatedCount = 0;

  for (const user of usersToUpdate) {
    let changed = false;

    if (user.avatarUrl === undefined) {
      user.avatarUrl = '';
      changed = true;
    }
    if (user.university === undefined) {
      user.university = user.college || '';
      changed = true;
    }
    if (!Array.isArray(user.interests)) {
      user.interests = [];
      changed = true;
    }
    if (!Array.isArray(user.preferredRoles) || user.preferredRoles.length === 0) {
      user.preferredRoles = ['Developer'];
      changed = true;
    }
    if (!user.experienceLevel) {
      user.experienceLevel = 'Beginner';
      changed = true;
    }
    if (!user.availability) {
      user.availability = 'available';
      changed = true;
    }
    if (!Array.isArray(user.pastProjects)) {
      user.pastProjects = [];
      changed = true;
    }
    if (!Array.isArray(user.achievements)) {
      user.achievements = [];
      changed = true;
    }
    if (!user.profileVisibility) {
      user.profileVisibility = 'public';
      changed = true;
    }
    if (user.onboardingCompleted === undefined) {
      user.onboardingCompleted = false;
      changed = true;
    }
    if (user.emailVerified === undefined) {
      user.emailVerified = false;
      changed = true;
    }

    if (changed) {
      await user.save();
      updatedCount += 1;
    }
  }

  console.log(`[backfill] completed. Updated ${updatedCount} user(s).`);
  return updatedCount;
}

async function main() {
  await connectDB();
  try {
    const count = await runBackfill();
    console.log(`[backfill] finished successfully (${count} modified)`);
  } catch (err) {
    console.error('[backfill] failed:', err);
    process.exit(1);
  } finally {
    await disconnectDB();
  }
}

if (require.main === module) {
  main();
}

module.exports = { runBackfill };
