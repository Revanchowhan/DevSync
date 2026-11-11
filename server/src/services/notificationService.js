const Notification = require('../models/Notification');

async function createNotification({ user, title, body, type, link }) {
  return Notification.create({ user, title, body, type, link });
}

async function notifyUsers(userIds, payload) {
  if (!userIds.length) return [];
  const docs = userIds.map((user) => ({ user, ...payload }));
  return Notification.insertMany(docs);
}

// Notify every hackathon participant about a new announcement.
async function notifyAnnouncement(hackathon, announcement) {
  const participantIds = (hackathon.participants || []).map((p) =>
    p && p._id ? p._id : p
  );
  return notifyUsers(participantIds, {
    title: `New announcement: ${announcement.title}`,
    body: announcement.body,
    type: 'announcement',
    link: `/hackathons/${hackathon._id}`,
  });
}

module.exports = { createNotification, notifyUsers, notifyAnnouncement };
