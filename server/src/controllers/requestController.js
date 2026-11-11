const Team = require('../models/Team');
const TeamRequest = require('../models/TeamRequest');
const Connection = require('../models/Connection');
const Idea = require('../models/Idea');
const { createNotification } = require('../services/notificationService');
const { asyncHandler, httpError } = require('../middleware/errorHandler');
const { toPublicStudent } = require('../utils/serializers');
const {
  _loadTeamWithHackathon,
  _isMember,
  _teamFormationClosed,
} = require('./teamController');

const POPULATE = [
  { path: 'team', select: 'name hackathon isOpen' },
  { path: 'fromUser', select: 'name college branch year skills github linkedin avatarUrl bio' },
  { path: 'toUser', select: 'name college branch year skills github linkedin avatarUrl bio' },
];

function applyPopulate(query) {
  for (const p of POPULATE) query = query.populate(p);
  return query;
}

// For 'join' requests the approver is the team owner; for 'invite' the invitee.
// Returns the user id that will actually join the team when approved.
function joinerOf(request) {
  return request.kind === 'join' ? String(request.fromUser) : String(request.toUser);
}

// POST /api/requests (student) — invite toUser to join teamId
async function createRequest(req, res) {
  const { teamId, toUserId, message } = req.body;

  if (String(toUserId) === String(req.user.id)) {
    throw httpError(400, 'You cannot send a team request to yourself');
  }

  const team = await _loadTeamWithHackathon(teamId);

  if (!_isMember(team, req.user.id)) {
    throw httpError(403, 'Only team members can send invites for this team');
  }
  if (!team.isOpen) throw httpError(400, 'This team is closed to new members');

  const teamSizeLimit = team.hackathon.teamSizeLimit || 4;
  if (team.members.length >= teamSizeLimit) {
    throw httpError(400, 'This team is already full');
  }

  if (_teamFormationClosed(team.hackathon)) {
    throw httpError(400, 'Team formation is closed for this hackathon');
  }

  const targetRegistered = team.hackathon.participants.some(
    (p) => String(p._id || p) === String(toUserId)
  );
  if (!targetRegistered) {
    throw httpError(400, 'The invited user is not registered in this hackathon');
  }

  if (_isMember(team, toUserId)) {
    throw httpError(400, 'This user is already in the team');
  }

  const duplicate = await TeamRequest.findOne({
    team: teamId,
    toUser: toUserId,
    status: 'pending',
  });
  if (duplicate) throw httpError(409, 'A pending request to this user already exists');

  let request;
  try {
    request = await TeamRequest.create({
      team: teamId,
      fromUser: req.user.id,
      toUser: toUserId,
      message,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw httpError(409, 'A pending request to this user already exists');
    }
    throw err;
  }

  await createNotification({
    user: toUserId,
    title: `New team invite: ${team.name}`,
    body: `You have been invited to join the team "${team.name}".`,
    type: 'team_request',
    link: '/requests',
  });

  const populated = await applyPopulate(TeamRequest.findById(request._id));
  return res.status(201).json({ request: populated });
}

// POST /api/requests/join (student) — request to join teamId (e.g. via invite code)
async function createJoinRequest(req, res) {
  const { teamId, message } = req.body;

  const team = await _loadTeamWithHackathon(teamId);

  if (!team.isOpen) throw httpError(400, 'This team is closed to new members');

  const teamSizeLimit = team.hackathon.teamSizeLimit || 4;
  if (team.members.length >= teamSizeLimit) {
    throw httpError(400, 'This team is already full');
  }

  if (_teamFormationClosed(team.hackathon)) {
    throw httpError(400, 'Team formation is closed for this hackathon');
  }

  const registered = team.hackathon.participants.some(
    (p) => String(p._id || p) === String(req.user.id)
  );
  if (!registered) {
    throw httpError(400, 'You must register for this hackathon first');
  }

  if (_isMember(team, req.user.id)) {
    throw httpError(400, 'You are already in this team');
  }

  const otherTeam = await Team.findOne({
    hackathon: team.hackathon._id,
    members: req.user.id,
  });
  if (otherTeam) {
    throw httpError(400, 'You are already in a team for this hackathon');
  }

  const duplicate = await TeamRequest.findOne({
    team: teamId,
    fromUser: req.user.id,
    kind: 'join',
    status: 'pending',
  });
  if (duplicate) throw httpError(409, 'You already have a pending request for this team');

  let request;
  try {
    request = await TeamRequest.create({
      team: teamId,
      fromUser: req.user.id,
      toUser: team.owner,
      kind: 'join',
      message,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw httpError(409, 'You already have a pending request for this team');
    }
    throw err;
  }

  const fromUser = await require('../models/User').findById(req.user.id).select('name');

  await createNotification({
    user: team.owner,
    title: `Join request for ${team.name}`,
    body: `${fromUser ? fromUser.name : 'Someone'} wants to join your team "${team.name}".`,
    type: 'team_request',
    link: '/requests',
  });

  const populated = await applyPopulate(TeamRequest.findById(request._id));
  return res.status(201).json({ request: populated });
}

// GET /api/requests?tab=sent|received (student)
async function listRequests(req, res) {
  const { tab } = req.query;
  const filter = {};
  if (tab === 'sent') filter.fromUser = req.user.id;
  else if (tab === 'received') filter.toUser = req.user.id;
  else filter.$or = [{ fromUser: req.user.id }, { toUser: req.user.id }];

  const requests = await applyPopulate(
    TeamRequest.find(filter).sort({ createdAt: -1 })
  );
  return res.status(200).json({ requests });
}

// PUT /api/requests/:id/accept (approver only: invitee for invites, owner for joins)
async function acceptRequest(req, res) {
  const request = await TeamRequest.findById(req.params.id);
  if (!request) throw httpError(404, 'Request not found');
  if (String(request.toUser) !== String(req.user.id)) {
    throw httpError(403, 'Only the recipient can accept this request');
  }
  if (request.status !== 'pending') {
    throw httpError(400, `This request has already been ${request.status}`);
  }

  const team = await _loadTeamWithHackathon(request.team);
  const joinerId = joinerOf(request);

  if (_teamFormationClosed(team.hackathon)) {
    throw httpError(400, 'Team formation is closed for this hackathon');
  }

  const teamSizeLimit = team.hackathon.teamSizeLimit || 4;
  if (team.members.length >= teamSizeLimit) {
    throw httpError(400, 'This team is already full');
  }
  if (_isMember(team, joinerId)) {
    throw httpError(400, 'This user is already in the team');
  }

  const otherTeam = await Team.findOne({
    hackathon: team.hackathon._id,
    members: joinerId,
  });
  if (otherTeam) {
    throw httpError(400, 'This user is already in a team for this hackathon');
  }

  team.members.push(joinerId);
  if (team.members.length >= teamSizeLimit) team.isOpen = false; // auto-close when full
  await team.save();

  request.status = 'accepted';
  await request.save();

  const User = require('../models/User');
  const joiner = await User.findById(joinerId).select('name');
  const joinerName = joiner ? joiner.name : 'A new member';

  if (request.kind === 'join') {
    // Notify the joiner…
    await createNotification({
      user: joinerId,
      title: `Request accepted: ${team.name}`,
      body: `Your request to join "${team.name}" was accepted.`,
      type: 'request_accepted',
      link: `/teams/${team._id}`,
    });
  } else {
    // Notify the inviter…
    await createNotification({
      user: request.fromUser,
      title: 'Invite accepted',
      body: `Your invite to "${team.name}" was accepted.`,
      type: 'request_accepted',
      link: `/teams/${team._id}`,
    });
    // …and the new member…
    await createNotification({
      user: joinerId,
      title: `You joined ${team.name}`,
      body: `Welcome to team "${team.name}".`,
      type: 'team_joined',
      link: `/teams/${team._id}`,
    });
  }
  // …and the rest of the team.
  const others = team.members.filter((m) => String(m._id || m) !== String(joinerId));
  for (const memberId of others) {
    await createNotification({
      user: memberId,
      title: `New teammate joined ${team.name}`,
      body: `${joinerName} joined your team.`,
      type: 'team_joined',
      link: `/teams/${team._id}`,
    });
  }

  const populated = await applyPopulate(TeamRequest.findById(request._id));
  return res.status(200).json({ request: populated });
}

// PUT /api/requests/:id/decline (approver only: invitee for invites, owner for joins)
async function declineRequest(req, res) {
  const request = await TeamRequest.findById(req.params.id);
  if (!request) throw httpError(404, 'Request not found');
  if (String(request.toUser) !== String(req.user.id)) {
    throw httpError(403, 'Only the recipient can decline this request');
  }
  if (request.status !== 'pending') {
    throw httpError(400, `This request has already been ${request.status}`);
  }

  request.status = 'declined';
  await request.save();

  const team = await Team.findById(request.team).select('name');
  const teamLabel = team ? `"${team.name}"` : 'the team';
  await createNotification({
    user: request.fromUser,
    title: request.kind === 'join' ? 'Join request declined' : 'Invite declined',
    body:
      request.kind === 'join'
        ? `Your request to join ${teamLabel} was declined.`
        : `Your invite to join ${teamLabel} was declined.`,
    type: 'request_declined',
    link: '/requests',
  });

  const populated = await applyPopulate(TeamRequest.findById(request._id));
  return res.status(200).json({ request: populated });
}

// DELETE /api/requests/:id (fromUser only, pending only) — cancel
async function cancelRequest(req, res) {
  const request = await TeamRequest.findById(req.params.id);
  if (!request) throw httpError(404, 'Request not found');
  if (String(request.fromUser) !== String(req.user.id)) {
    throw httpError(403, 'Only the sender can cancel this request');
  }
  if (request.status !== 'pending') {
    throw httpError(400, 'Only pending requests can be cancelled');
  }
  await request.deleteOne();
  return res.status(200).json({ message: 'Request cancelled' });
}

// GET /api/requests/all (student) — unified aggregator across teams, connections & ideas
async function listAllRequests(req, res) {
  const userId = req.user.id;
  const { tab = 'all', type = 'all' } = req.query; // tab: 'received'|'sent'|'accepted'|'declined'|'all'

  const items = [];

  // 1. Team Requests
  if (type === 'all' || type === 'team_request') {
    const rawTeamReqs = await TeamRequest.find({
      $or: [{ fromUser: userId }, { toUser: userId }],
    })
      .populate('team', 'name hackathon')
      .populate('fromUser')
      .populate('toUser')
      .sort({ createdAt: -1 });

    for (const r of rawTeamReqs) {
      const isReceived = String(r.toUser?._id || r.toUser) === String(userId);
      const direction = isReceived ? 'received' : 'sent';
      const other = isReceived ? r.fromUser : r.toUser;

      items.push({
        _id: r._id,
        type: 'team_request',
        subtype: r.kind, // 'invite' | 'join'
        status: r.status,
        direction,
        user: toPublicStudent(other) || { name: 'Student Builder' },
        title: r.team?.name || 'Hackathon Team',
        message: r.message || '',
        targetId: r.team?._id,
        createdAt: r.createdAt,
      });
    }
  }

  // 2. Peer Connections
  if (type === 'all' || type === 'connection') {
    const rawConns = await Connection.find({
      $or: [{ requester: userId }, { recipient: userId }],
    })
      .populate('requester')
      .populate('recipient')
      .sort({ createdAt: -1 });

    for (const c of rawConns) {
      const isReceived = String(c.recipient?._id || c.recipient) === String(userId);
      const direction = isReceived ? 'received' : 'sent';
      const other = isReceived ? c.requester : c.recipient;

      items.push({
        _id: c._id,
        type: 'connection',
        subtype: 'peer',
        status: c.status,
        direction,
        user: toPublicStudent(other) || { name: 'Student Builder' },
        title: 'Peer Connection',
        message: c.message || '',
        targetId: c._id,
        createdAt: c.createdAt,
      });
    }
  }

  // 3. Idea Interests
  if (type === 'all' || type === 'idea_interest') {
    const rawIdeas = await Idea.find({
      $or: [{ owner: userId }, { 'interested.user': userId }],
    })
      .populate('owner')
      .populate('interested.user')
      .sort({ createdAt: -1 });

    for (const idea of rawIdeas) {
      const isOwner = String(idea.owner?._id || idea.owner) === String(userId);

      if (isOwner) {
        // As owner, all interested applicants are received
        for (const entry of idea.interested || []) {
          items.push({
            _id: `${idea._id}_${entry.user?._id || entry.user}`,
            type: 'idea_interest',
            subtype: 'application',
            status: entry.status,
            direction: 'received',
            user: toPublicStudent(entry.user) || { name: 'Student Builder' },
            title: idea.title,
            message: entry.message || '',
            targetId: idea._id,
            createdAt: entry.createdAt,
          });
        }
      } else {
        // As applicant, own entry is sent
        const myEntry = (idea.interested || []).find(
          (entry) => String(entry.user?._id || entry.user) === String(userId)
        );
        if (myEntry) {
          items.push({
            _id: `${idea._id}_${userId}`,
            type: 'idea_interest',
            subtype: 'application',
            status: myEntry.status,
            direction: 'sent',
            user: toPublicStudent(idea.owner) || { name: 'Idea Owner' },
            title: idea.title,
            message: myEntry.message || '',
            targetId: idea._id,
            createdAt: myEntry.createdAt,
          });
        }
      }
    }
  }

  // Filter by tab if not 'all'
  let filtered = items;
  if (tab === 'received') {
    filtered = filtered.filter((i) => i.direction === 'received' && i.status === 'pending');
  } else if (tab === 'sent') {
    filtered = filtered.filter((i) => i.direction === 'sent' && i.status === 'pending');
  } else if (tab === 'accepted') {
    filtered = filtered.filter((i) => i.status === 'accepted');
  } else if (tab === 'declined') {
    filtered = filtered.filter((i) => i.status === 'declined');
  }

  // Sort by latest
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.status(200).json({ requests: filtered, count: filtered.length });
}

module.exports = {
  createRequest: asyncHandler(createRequest),
  createJoinRequest: asyncHandler(createJoinRequest),
  listRequests: asyncHandler(listRequests),
  listAllRequests: asyncHandler(listAllRequests),
  acceptRequest: asyncHandler(acceptRequest),
  declineRequest: asyncHandler(declineRequest),
  cancelRequest: asyncHandler(cancelRequest),
};
