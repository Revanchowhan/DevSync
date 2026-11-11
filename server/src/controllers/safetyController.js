const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Block = require('../models/Block');
const Report = require('../models/Report');
const Connection = require('../models/Connection');
const Team = require('../models/Team');
const TeamRequest = require('../models/TeamRequest');
const EmailVerificationToken = require('../models/EmailVerificationToken');
const { sendVerificationEmail } = require('../services/emailService');
const { asyncHandler, httpError } = require('../middleware/errorHandler');
const { toPublicStudent } = require('../utils/serializers');

async function reportUser(req, res) {
  const { targetUserId, reason, details = '' } = req.body;
  const reporterId = req.user.id;

  if (String(targetUserId) === String(reporterId)) {
    throw httpError(400, 'You cannot report your own account.');
  }

  const target = await User.findById(targetUserId);
  if (!target) throw httpError(404, 'Reported user not found.');

  const report = await Report.create({
    reporter: reporterId,
    target: targetUserId,
    reason,
    details,
  });

  return res.status(201).json({ message: 'Report submitted. Our moderation team will review it.', report });
}

async function blockUser(req, res) {
  const { targetUserId } = req.body;
  const blockerId = req.user.id;

  if (String(targetUserId) === String(blockerId)) {
    throw httpError(400, 'You cannot block yourself.');
  }

  const target = await User.findById(targetUserId);
  if (!target) throw httpError(404, 'User not found.');

  // Create block record (unique index handles duplicates)
  try {
    await Block.create({ blocker: blockerId, blocked: targetUserId });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(200).json({ message: 'User is already blocked.' });
    }
    throw err;
  }

  // Safety cleanup: immediately delete connections and team requests between both users
  const b1 = blockerId.toString();
  const b2 = targetUserId.toString();
  const userLow = b1 < b2 ? blockerId : targetUserId;
  const userHigh = b1 < b2 ? targetUserId : blockerId;

  await Connection.deleteMany({ userLow, userHigh });
  await TeamRequest.deleteMany({
    $or: [
      { fromUser: blockerId, toUser: targetUserId },
      { fromUser: targetUserId, toUser: blockerId },
    ],
  });

  return res.status(201).json({ message: 'User blocked successfully.' });
}

async function unblockUser(req, res) {
  const { targetUserId } = req.params;
  const blockerId = req.user.id;

  await Block.deleteOne({ blocker: blockerId, blocked: targetUserId });
  return res.status(200).json({ message: 'User unblocked successfully.' });
}

async function listBlockedUsers(req, res) {
  const blocks = await Block.find({ blocker: req.user.id }).populate('blocked');
  const blocked = blocks
    .map((b) => toPublicStudent(b.blocked))
    .filter(Boolean);

  return res.status(200).json({ blocked });
}

async function requestEmailVerification(req, res) {
  const { collegeEmail } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) throw httpError(404, 'User not found.');

  const emailToVerify = (collegeEmail || user.email).toLowerCase().trim();

  // Validate academic domain indicator (.edu, .ac., or standard university emails)
  const isEdu = /\.edu($|\.)|\.ac\./i.test(emailToVerify);
  if (!isEdu) {
    throw httpError(400, 'Verification requires a valid university student email ending in .edu or .ac.*');
  }

  // Delete previous pending token if exists
  await EmailVerificationToken.deleteMany({ user: user._id });

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await EmailVerificationToken.create({
    user: user._id,
    token,
    collegeEmail: emailToVerify,
    expiresAt,
  });

  const emailResult = await sendVerificationEmail({
    to: emailToVerify,
    token,
    name: user.name,
  });

  return res.status(200).json({
    message: 'Verification link sent to your university email address.',
    simulated: emailResult.simulated || false,
    token: emailResult.simulated ? token : undefined,
  });
}

async function confirmEmailVerification(req, res) {
  const { token } = req.body;
  if (!token) throw httpError(400, 'Verification token is required.');

  const record = await EmailVerificationToken.findOne({ token });
  if (!record) {
    throw httpError(400, 'Invalid or expired verification token.');
  }

  if (new Date() > record.expiresAt) {
    await EmailVerificationToken.deleteOne({ _id: record._id });
    throw httpError(400, 'Verification token has expired. Please request a new link.');
  }

  const user = await User.findById(record.user);
  if (!user) throw httpError(404, 'User associated with token not found.');

  user.emailVerified = true;
  await user.save();

  await EmailVerificationToken.deleteOne({ _id: record._id });

  return res.status(200).json({
    verified: true,
    message: 'Your university email is verified! Student builder badge unlocked ✨',
  });
}

async function deleteAccount(req, res) {
  const { password } = req.body;
  if (!password) throw httpError(400, 'Password confirmation is required to delete your account.');

  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!user) throw httpError(404, 'User not found.');

  if (user.passwordHash) {
    const matches = await bcrypt.compare(password, user.passwordHash);
    if (!matches) throw httpError(401, 'Incorrect password confirmation.');
  }

  const userId = user._id;

  // Cleanup user from teams
  await Team.updateMany({ members: userId }, { $pull: { members: userId } });
  // Close any teams owned by this user
  await Team.updateMany({ owner: userId }, { isOpen: false });
  // Delete connections
  await Connection.deleteMany({ $or: [{ requester: userId }, { recipient: userId }] });
  // Delete requests
  await TeamRequest.deleteMany({ $or: [{ fromUser: userId }, { toUser: userId }] });
  // Delete block records
  await Block.deleteMany({ $or: [{ blocker: userId }, { blocked: userId }] });

  // Delete user record
  await User.deleteOne({ _id: userId });

  return res.status(200).json({ message: 'Account permanently deleted.' });
}

module.exports = {
  reportUser: asyncHandler(reportUser),
  blockUser: asyncHandler(blockUser),
  unblockUser: asyncHandler(unblockUser),
  listBlockedUsers: asyncHandler(listBlockedUsers),
  requestEmailVerification: asyncHandler(requestEmailVerification),
  confirmEmailVerification: asyncHandler(confirmEmailVerification),
  deleteAccount: asyncHandler(deleteAccount),
};
