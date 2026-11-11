const Notification = require('../models/Notification');
const { asyncHandler, httpError } = require('../middleware/errorHandler');

async function listNotifications(req, res) {
  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .lean();
  return res.status(200).json({ notifications });
}

async function markRead(req, res) {
  const notification = await Notification.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!notification) throw httpError(404, 'Notification not found');
  notification.read = true;
  await notification.save();
  return res.status(200).json({ notification });
}

async function unreadCount(req, res) {
  const count = await Notification.countDocuments({ user: req.user.id, read: false });
  return res.status(200).json({ count });
}

module.exports = {
  listNotifications: asyncHandler(listNotifications),
  markRead: asyncHandler(markRead),
  unreadCount: asyncHandler(unreadCount),
};
