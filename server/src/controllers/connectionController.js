const Connection = require('../models/Connection');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const { asyncHandler, httpError } = require('../middleware/errorHandler');
const { toPublicStudent } = require('../utils/serializers');

const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24-hour cooldown after decline/cancel

async function sendConnectionRequest(req, res) {
  const { recipientId, message } = req.body;
  const requesterId = req.user.id;

  if (String(recipientId) === String(requesterId)) {
    throw httpError(400, 'You cannot send a connection request to yourself.');
  }

  const recipient = await User.findById(recipientId);
  if (!recipient || recipient.role !== 'student') {
    throw httpError(404, 'Recipient student not found.');
  }

  const Block = require('../models/Block');
  const isBlocked = await Block.findOne({
    $or: [
      { blocker: requesterId, blocked: recipientId },
      { blocker: recipientId, blocked: requesterId },
    ],
  });
  if (isBlocked) {
    throw httpError(403, 'Cannot connect with this user due to privacy/blocking settings.');
  }

  // Determine low/high ids for pair lookup
  const r1 = requesterId.toString();
  const r2 = recipientId.toString();
  const userLow = r1 < r2 ? requesterId : recipientId;
  const userHigh = r1 < r2 ? recipientId : requesterId;

  let existing = await Connection.findOne({ userLow, userHigh });

  if (existing) {
    if (existing.status === 'pending') {
      throw httpError(409, 'A connection request between these users is already pending.');
    }
    if (existing.status === 'accepted') {
      throw httpError(409, 'You are already connected with this student.');
    }

    // Cooldown check for re-requests
    const timeSinceLast = Date.now() - new Date(existing.lastRequestedAt || existing.updatedAt).getTime();
    if (timeSinceLast < COOLDOWN_MS) {
      const hoursRemaining = Math.ceil((COOLDOWN_MS - timeSinceLast) / (60 * 60 * 1000));
      throw httpError(
        409,
        `Connection request cooldown in effect. Please wait ${hoursRemaining} hour(s) before requesting again.`
      );
    }

    // Reuse existing record after cooldown
    existing.requester = requesterId;
    existing.recipient = recipientId;
    existing.status = 'pending';
    existing.message = message || '';
    existing.lastRequestedAt = new Date();
    await existing.save();

    await createNotification({
      user: recipientId,
      title: 'New Connection Request',
      body: `${req.user.name || 'A student'} wants to connect with you.`,
      type: 'connection_request',
      link: '/requests',
    });

    return res.status(201).json({ connection: existing });
  }

  // Create new connection
  const connection = await Connection.create({
    requester: requesterId,
    recipient: recipientId,
    message: message || '',
    status: 'pending',
    lastRequestedAt: new Date(),
  });

  await createNotification({
    user: recipientId,
    title: 'New Connection Request',
    body: `${req.user.name || 'A student'} wants to connect with you.`,
    type: 'connection_request',
    link: '/requests',
  });

  return res.status(201).json({ connection });
}

async function listConnections(req, res) {
  const userId = req.user.id;
  const { status, type } = req.query;

  const filter = {
    $or: [{ requester: userId }, { recipient: userId }],
  };

  if (status) {
    filter.status = status;
  }

  if (type === 'received') {
    filter.recipient = userId;
  } else if (type === 'sent') {
    filter.requester = userId;
  }

  const rawConnections = await Connection.find(filter)
    .populate('requester')
    .populate('recipient')
    .sort({ updatedAt: -1 });

  const connections = rawConnections.map((c) => {
    const obj = c.toObject();
    obj.requester = toPublicStudent(obj.requester) || { _id: obj.requester?._id, name: 'DevSync Member' };
    obj.recipient = toPublicStudent(obj.recipient) || { _id: obj.recipient?._id, name: 'DevSync Member' };
    return obj;
  });

  return res.status(200).json({ connections });
}

async function acceptConnection(req, res) {
  const connection = await Connection.findById(req.params.id);
  if (!connection) throw httpError(404, 'Connection request not found.');

  if (String(connection.recipient) !== String(req.user.id)) {
    throw httpError(403, 'Only the recipient can accept this connection request.');
  }

  if (connection.status !== 'pending') {
    throw httpError(409, `Cannot accept connection in '${connection.status}' state.`);
  }

  connection.status = 'accepted';
  await connection.save();

  await createNotification({
    user: connection.requester,
    title: 'Connection Accepted',
    body: `${req.user.name || 'Your recipient'} accepted your connection request.`,
    type: 'connection_accepted',
    link: '/profile',
  });

  return res.status(200).json({ connection });
}

async function declineConnection(req, res) {
  const connection = await Connection.findById(req.params.id);
  if (!connection) throw httpError(404, 'Connection request not found.');

  if (String(connection.recipient) !== String(req.user.id)) {
    throw httpError(403, 'Only the recipient can decline this connection request.');
  }

  if (connection.status !== 'pending') {
    throw httpError(409, `Cannot decline connection in '${connection.status}' state.`);
  }

  connection.status = 'declined';
  await connection.save();

  return res.status(200).json({ connection });
}

async function cancelOrRemoveConnection(req, res) {
  const connection = await Connection.findById(req.params.id);
  if (!connection) throw httpError(404, 'Connection not found.');

  const isRequester = String(connection.requester) === String(req.user.id);
  const isRecipient = String(connection.recipient) === String(req.user.id);

  if (!isRequester && !isRecipient) {
    throw httpError(403, 'You are not a participant in this connection.');
  }

  if (connection.status === 'pending') {
    if (!isRequester) {
      throw httpError(403, 'Only the requester can cancel a pending connection request.');
    }
    connection.status = 'cancelled';
    connection.lastRequestedAt = new Date();
    await connection.save();
    return res.status(200).json({ message: 'Connection request cancelled.', connection });
  }

  // If accepted, transition to cancelled with cooldown timestamp to prevent harassment
  connection.status = 'cancelled';
  connection.lastRequestedAt = new Date();
  await connection.save();
  return res.status(200).json({ message: 'Connection removed.', connection });
}

module.exports = {
  sendConnectionRequest: asyncHandler(sendConnectionRequest),
  listConnections: asyncHandler(listConnections),
  acceptConnection: asyncHandler(acceptConnection),
  declineConnection: asyncHandler(declineConnection),
  cancelOrRemoveConnection: asyncHandler(cancelOrRemoveConnection),
  COOLDOWN_MS,
};
