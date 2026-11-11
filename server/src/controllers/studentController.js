const mongoose = require('mongoose');
const User = require('../models/User');
const { calculateMatch } = require('../services/matching');
const { toPublicStudent } = require('../utils/serializers');
const { escapeRegex } = require('../utils/sanitize');
const { normalizeSkill } = require('../utils/skills');
const { asyncHandler } = require('../middleware/errorHandler');

// Stub for blocked user lookup (will be wired with Block model in M4)
async function getBlockedUserIds(userId) {
  try {
    const Block = require('../models/Block');
    const blocks = await Block.find({
      $or: [{ blocker: userId }, { blocked: userId }],
    }).select('blocker blocked');

    const ids = new Set();
    blocks.forEach((b) => {
      if (String(b.blocker) === String(userId)) ids.add(b.blocked.toString());
      if (String(b.blocked) === String(userId)) ids.add(b.blocker.toString());
    });
    return Array.from(ids);
  } catch {
    return [];
  }
}

async function discoverStudents(req, res) {
  const currentUserId = req.user.id;
  const currentUser = await User.findById(currentUserId);

  const {
    search,
    skills,
    college,
    branch,
    year,
    interests,
    role,
    experience,
    availability,
    cursor,
    limit: rawLimit = 20,
  } = req.query;

  const limit = Math.min(50, Math.max(1, parseInt(rawLimit, 10) || 20));

  const blockedIds = await getBlockedUserIds(currentUserId);
  const excludeIds = [currentUserId, ...blockedIds];

  const filter = {
    _id: { $nin: excludeIds },
    role: 'student',
    profileVisibility: { $ne: 'hidden' },
  };

  if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
    filter._id.$lt = new mongoose.Types.ObjectId(cursor);
  }

  const andConditions = [];

  if (search && search.trim()) {
    const safeRegex = new RegExp(escapeRegex(search.trim()), 'i');
    andConditions.push({
      $or: [
        { name: safeRegex },
        { college: safeRegex },
        { university: safeRegex },
        { bio: safeRegex },
      ],
    });
  }

  if (college && college.trim()) {
    const rx = new RegExp(escapeRegex(college.trim()), 'i');
    andConditions.push({
      $or: [{ college: rx }, { university: rx }],
    });
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  if (skills) {
    const skillList = (Array.isArray(skills) ? skills : skills.split(','))
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => normalizeSkill(s));

    if (skillList.length > 0) {
      filter['skills.name'] = { $in: skillList.map((s) => new RegExp(`^${escapeRegex(s)}$`, 'i')) };
    }
  }

  if (branch && branch.trim()) {
    filter.branch = new RegExp(escapeRegex(branch.trim()), 'i');
  }

  if (year) {
    const parsedYear = parseInt(year, 10);
    if (!isNaN(parsedYear)) {
      filter.year = parsedYear;
    }
  }

  if (interests) {
    const interestList = (Array.isArray(interests) ? interests : interests.split(','))
      .map((i) => i.trim())
      .filter(Boolean);
    if (interestList.length > 0) {
      filter.interests = { $in: interestList.map((i) => new RegExp(`^${escapeRegex(i)}$`, 'i')) };
    }
  }

  if (role && role.trim()) {
    filter.preferredRoles = new RegExp(`^${escapeRegex(role.trim())}$`, 'i');
  }

  if (experience && experience.trim()) {
    filter.experienceLevel = new RegExp(`^${escapeRegex(experience.trim())}$`, 'i');
  }

  if (availability && availability.trim()) {
    filter.availability = availability.trim().toLowerCase();
  }

  // Pre-filter with limit + 1 to check hasMore
  const rawCandidates = await User.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = rawCandidates.length > limit;
  const slicedCandidates = hasMore ? rawCandidates.slice(0, limit) : rawCandidates;
  const nextCursor =
    hasMore && slicedCandidates.length > 0
      ? slicedCandidates[slicedCandidates.length - 1]._id.toString()
      : null;

  const students = slicedCandidates
    .map((candidate) => {
      const publicStudent = toPublicStudent(candidate);
      if (!publicStudent) return null;

      const match = calculateMatch(currentUser, candidate);
      return {
        ...publicStudent,
        match,
      };
    })
    .filter(Boolean);

  // Default ordering in discovery page: sort by match score desc if not using cursor-scroll
  if (!cursor) {
    students.sort((a, b) => b.match.score - a.match.score);
  }

  return res.status(200).json({
    students,
    nextCursor,
    hasMore,
  });
}

module.exports = {
  discoverStudents: asyncHandler(discoverStudents),
};
