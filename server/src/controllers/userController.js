const User = require('../models/User');
const Notification = require('../models/Notification');
const { asyncHandler, httpError } = require('../middleware/errorHandler');
const { normalizeSkillObject } = require('../utils/skills');
const { calculateProfileCompletion } = require('../utils/profileCompletion');

const HOST_FIELDS =
  'name email role organization hostStatus hostStatusNote isAdmin createdAt';

const EDITABLE_STUDENT_FIELDS = [
  'name',
  'college',
  'university',
  'branch',
  'year',
  'skills',
  'interests',
  'preferredRoles',
  'experienceLevel',
  'availability',
  'pastProjects',
  'achievements',
  'github',
  'linkedin',
  'bio',
  'avatarUrl',
  'profileVisibility',
  'onboardingCompleted',
];

async function getMe(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) throw httpError(404, 'User not found');
  const userJson = user.toJSON();
  const completion = user.role === 'student' ? calculateProfileCompletion(userJson) : 100;
  return res.status(200).json({ user: { ...userJson, completionPercentage: completion } });
}

async function updateMe(req, res) {
  if (req.user.role !== 'student') {
    throw httpError(403, 'Only students can update their profile');
  }

  // Validate avatarUrl format if provided
  if (req.body.avatarUrl && req.body.avatarUrl.trim()) {
    const url = req.body.avatarUrl.trim();
    if (!/^https:\/\/[^ "]+$/.test(url)) {
      throw httpError(400, 'avatarUrl must be a valid secure URL starting with https://');
    }
  }

  const updates = {};
  for (const field of EDITABLE_STUDENT_FIELDS) {
    if (req.body[field] !== undefined) {
      if (field === 'skills' && Array.isArray(req.body.skills)) {
        updates.skills = req.body.skills.map(normalizeSkillObject).filter(Boolean);
      } else {
        updates[field] = req.body[field];
      }
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });
  if (!user) throw httpError(404, 'User not found');

  const userJson = user.toJSON();
  const completion = calculateProfileCompletion(userJson);

  return res.status(200).json({
    user: {
      ...userJson,
      completionPercentage: completion,
    },
  });
}

// ---- Admin: host approval queue ----
async function listHostRequests(req, res) {
  const hosts = await User.find({ role: 'host' })
    .select(HOST_FIELDS)
    .sort({ createdAt: -1 });
  const pending = hosts.filter((h) => h.hostStatus === 'pending');
  return res.status(200).json({ pending, hosts });
}

async function decideHost(req, res, status) {
  const host = await User.findById(req.params.id);
  if (!host || host.role !== 'host') throw httpError(404, 'Host account not found');
  if (host.isAdmin) throw httpError(400, 'Admin accounts cannot be changed here.');
  host.hostStatus = status;
  host.hostStatusNote = status === 'rejected' ? String(req.body?.note || '').trim() : '';
  await host.save();

  await Notification.create({
    user: host._id,
    title: status === 'approved' ? 'Host account approved!' : 'Host account update',
    body:
      status === 'approved'
        ? 'Your host account has been approved. You can now create and manage hackathons.'
        : `Your host account was not approved.${host.hostStatusNote ? ` Reason: ${host.hostStatusNote}` : ''}`,
    type: status === 'approved' ? 'request_accepted' : 'request_declined',
    link: status === 'approved' ? '/host' : '/',
  });

  return res.status(200).json({ host: host.toJSON() });
}

async function approveHost(req, res) {
  return decideHost(req, res, 'approved');
}

async function rejectHost(req, res) {
  return decideHost(req, res, 'rejected');
}

module.exports = {
  getMe: asyncHandler(getMe),
  updateMe: asyncHandler(updateMe),
  listHostRequests: asyncHandler(listHostRequests),
  approveHost: asyncHandler(approveHost),
  rejectHost: asyncHandler(rejectHost),
};
