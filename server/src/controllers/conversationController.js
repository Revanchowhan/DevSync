const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Connection = require('../models/Connection');
const Team = require('../models/Team');
const Block = require('../models/Block');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const { asyncHandler, httpError } = require('../middleware/errorHandler');
const { toPublicStudent } = require('../utils/serializers');

// Helper to check if two users have a block in either direction
async function isBlockedBetween(u1, u2) {
  const block = await Block.findOne({
    $or: [
      { blocker: u1, blocked: u2 },
      { blocker: u2, blocked: u1 },
    ],
  });
  return !!block;
}

async function listConversations(req, res) {
  const userId = req.user.id;

  const conversations = await Conversation.find({ participants: userId })
    .sort({ lastMessageAt: -1 })
    .populate('participants')
    .populate('team', 'name hackathon')
    .populate('lastMessageSender', 'name')
    .lean();

  const results = await Promise.all(
    conversations.map(async (conv) => {
      // Clean participants with public serializer
      const cleanParticipants = (conv.participants || []).map(toPublicStudent);

      // Find user's last read timestamp
      const readRecord = (conv.lastRead || []).find(
        (r) => String(r.user) === String(userId)
      );
      const lastReadAt = readRecord ? new Date(readRecord.lastReadAt) : new Date(0);

      // Calculate unread count
      const unreadCount = await Message.countDocuments({
        conversation: conv._id,
        createdAt: { $gt: lastReadAt },
        sender: { $ne: userId },
      });

      return {
        ...conv,
        participants: cleanParticipants,
        unreadCount,
      };
    })
  );

  return res.status(200).json({ conversations: results });
}

async function getOrCreateDirectConversation(req, res) {
  const { recipientId } = req.body;
  const currentUserId = req.user.id;

  if (String(recipientId) === String(currentUserId)) {
    throw httpError(400, 'Cannot start a conversation with yourself.');
  }

  // 1. Verify not blocked in either direction
  if (await isBlockedBetween(currentUserId, recipientId)) {
    throw httpError(403, 'Cannot start conversation with this user due to privacy/blocking settings.');
  }

  // 2. Verify accepted connection
  const r1 = currentUserId.toString();
  const r2 = recipientId.toString();
  const userLow = r1 < r2 ? currentUserId : recipientId;
  const userHigh = r1 < r2 ? recipientId : currentUserId;

  const connection = await Connection.findOne({ userLow, userHigh, status: 'accepted' });
  if (!connection) {
    throw httpError(403, 'Direct messaging is only available between accepted student connections.');
  }

  // 3. Find or create conversation
  const participantsKey = `${userLow}_${userHigh}`;
  let conversation = await Conversation.findOne({ participantsKey })
    .populate('participants')
    .populate('lastMessageSender', 'name');

  if (!conversation) {
    conversation = await Conversation.create({
      type: 'direct',
      participants: [currentUserId, recipientId],
      participantsKey,
      lastRead: [
        { user: currentUserId, lastReadAt: new Date() },
        { user: recipientId, lastReadAt: new Date() },
      ],
    });
    conversation = await Conversation.findById(conversation._id).populate('participants');
  }

  const convObj = conversation.toObject();
  convObj.participants = (convObj.participants || []).map(toPublicStudent);

  return res.status(200).json({ conversation: convObj });
}

async function getOrCreateTeamConversation(req, res) {
  const { teamId } = req.params;
  const currentUserId = req.user.id;

  const team = await Team.findById(teamId);
  if (!team) throw httpError(404, 'Team not found.');

  const isMem = team.members.some((m) => String(m) === String(currentUserId));
  if (!isMem) {
    throw httpError(403, 'Only current team members can access team conversation.');
  }

  let conversation = await Conversation.findOne({ team: teamId, type: 'team' })
    .populate('participants')
    .populate('team', 'name');

  if (!conversation) {
    conversation = await Conversation.create({
      type: 'team',
      team: teamId,
      participants: team.members,
      lastRead: team.members.map((m) => ({ user: m, lastReadAt: new Date() })),
    });
    conversation = await Conversation.findById(conversation._id)
      .populate('participants')
      .populate('team', 'name');
  } else {
    // Keep members synchronized
    conversation.participants = team.members;
    await conversation.save();
  }

  const convObj = conversation.toObject();
  convObj.participants = (convObj.participants || []).map(toPublicStudent);

  return res.status(200).json({ conversation: convObj });
}

async function getMessages(req, res) {
  const { id } = req.params;
  const currentUserId = req.user.id;
  const { after, limit: rawLimit = 30 } = req.query;
  const limit = Math.min(50, Math.max(1, parseInt(rawLimit, 10) || 30));

  const conversation = await Conversation.findById(id);
  if (!conversation) throw httpError(404, 'Conversation not found.');

  // Access control
  if (conversation.type === 'direct') {
    const isParticipant = conversation.participants.some(
      (p) => String(p) === String(currentUserId)
    );
    if (!isParticipant) {
      throw httpError(403, 'You do not have access to this conversation.');
    }

    const otherUser = conversation.participants.find(
      (p) => String(p) !== String(currentUserId)
    );
    if (otherUser && (await isBlockedBetween(currentUserId, otherUser))) {
      throw httpError(403, 'Conversation access restricted.');
    }
  } else if (conversation.type === 'team') {
    const team = await Team.findById(conversation.team);
    if (!team || !team.members.some((m) => String(m) === String(currentUserId))) {
      throw httpError(403, 'You are not a current member of this team.');
    }
  }

  const query = { conversation: id };
  if (after) {
    query.createdAt = { $gt: new Date(after) };
  }

  const rawMessages = await Message.find(query)
    .sort({ createdAt: 1 })
    .limit(limit)
    .populate('sender')
    .lean();

  const messages = rawMessages.map((m) => ({
    ...m,
    sender: toPublicStudent(m.sender) || { name: 'Member' },
  }));

  return res.status(200).json({ messages });
}

async function sendMessage(req, res) {
  const { id } = req.params;
  const { text } = req.body;
  const currentUserId = req.user.id;

  if (!text || !text.trim()) {
    throw httpError(400, 'Message text cannot be empty.');
  }

  const conversation = await Conversation.findById(id);
  if (!conversation) throw httpError(404, 'Conversation not found.');

  let otherParticipantIds = [];

  // Check authorization
  if (conversation.type === 'direct') {
    const isParticipant = conversation.participants.some(
      (p) => String(p) === String(currentUserId)
    );
    if (!isParticipant) {
      throw httpError(403, 'You cannot send messages in this conversation.');
    }

    const otherUser = conversation.participants.find(
      (p) => String(p) !== String(currentUserId)
    );
    if (otherUser) {
      if (await isBlockedBetween(currentUserId, otherUser)) {
        throw httpError(403, 'Cannot message this user due to privacy/blocking settings.');
      }
      otherParticipantIds.push(otherUser.toString());
    }
  } else if (conversation.type === 'team') {
    const team = await Team.findById(conversation.team);
    if (!team || !team.members.some((m) => String(m) === String(currentUserId))) {
      throw httpError(403, 'Only current team members can send team messages.');
    }
    otherParticipantIds = team.members
      .filter((m) => String(m) !== String(currentUserId))
      .map((m) => m.toString());
  }

  const message = await Message.create({
    conversation: id,
    sender: currentUserId,
    text: text.trim().slice(0, 2000),
    createdAt: new Date(),
  });

  // Update conversation last message details
  conversation.lastMessageText = text.trim().slice(0, 100);
  conversation.lastMessageAt = new Date();
  conversation.lastMessageSender = currentUserId;

  // Update sender lastRead timestamp
  const myRead = (conversation.lastRead || []).find(
    (r) => String(r.user) === String(currentUserId)
  );
  if (myRead) {
    myRead.lastReadAt = new Date();
  } else {
    conversation.lastRead.push({ user: currentUserId, lastReadAt: new Date() });
  }

  await conversation.save();

  // Create notifications for other participants
  for (const recipientId of otherParticipantIds) {
    await createNotification({
      user: recipientId,
      title: conversation.type === 'direct' ? 'New Message' : 'New Team Message',
      body: `${req.user.name || 'A builder'}: "${text.trim().slice(0, 60)}"`,
      type: 'new_message',
      link: '/messages',
    });
  }

  const populated = await Message.findById(message._id).populate('sender');
  const messageObj = populated.toObject();
  messageObj.sender = toPublicStudent(messageObj.sender);

  return res.status(201).json({ message: messageObj });
}

async function markAsRead(req, res) {
  const { id } = req.params;
  const currentUserId = req.user.id;

  const conversation = await Conversation.findById(id);
  if (!conversation) throw httpError(404, 'Conversation not found.');

  const readRecord = (conversation.lastRead || []).find(
    (r) => String(r.user) === String(currentUserId)
  );

  if (readRecord) {
    readRecord.lastReadAt = new Date();
  } else {
    conversation.lastRead.push({ user: currentUserId, lastReadAt: new Date() });
  }

  await conversation.save();
  return res.status(200).json({ message: 'Conversation marked as read.' });
}

async function getUnreadTotal(req, res) {
  const userId = req.user.id;
  const conversations = await Conversation.find({ participants: userId }).lean();

  let totalUnread = 0;
  for (const conv of conversations) {
    const readRecord = (conv.lastRead || []).find((r) => String(r.user) === String(userId));
    const lastReadAt = readRecord ? new Date(readRecord.lastReadAt) : new Date(0);

    const count = await Message.countDocuments({
      conversation: conv._id,
      createdAt: { $gt: lastReadAt },
      sender: { $ne: userId },
    });
    totalUnread += count;
  }

  return res.status(200).json({ unreadTotal: totalUnread });
}

module.exports = {
  listConversations: asyncHandler(listConversations),
  getOrCreateDirectConversation: asyncHandler(getOrCreateDirectConversation),
  getOrCreateTeamConversation: asyncHandler(getOrCreateTeamConversation),
  getMessages: asyncHandler(getMessages),
  sendMessage: asyncHandler(sendMessage),
  markAsRead: asyncHandler(markAsRead),
  getUnreadTotal: asyncHandler(getUnreadTotal),
};
