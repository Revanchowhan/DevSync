const Hackathon = require('../models/Hackathon');
const Team = require('../models/Team');
const TeamRequest = require('../models/TeamRequest');
const Announcement = require('../models/Announcement');
const Notification = require('../models/Notification');
const { notifyAnnouncement } = require('../services/notificationService');
const { toCsv } = require('../utils/csv');
const { asyncHandler, httpError } = require('../middleware/errorHandler');

function registrationClosed(hackathon, now = new Date()) {
  return !hackathon.isOpen || now > hackathon.registrationDeadline;
}

function summarize(hackathon, teamCounts, reqUser) {
  const obj = hackathon.toObject ? hackathon.toObject() : hackathon;
  const id = String(obj._id);
  const memberIds = (obj.participants || []).map((p) => String(p._id || p));
  const summary = {
    ...obj,
    participantCount: memberIds.length,
    teamCount: teamCounts.get(id) || 0,
    status: registrationClosed(hackathon) ? 'closed' : 'open',
    isRegistered:
      reqUser && reqUser.role === 'student'
        ? memberIds.includes(String(reqUser.id))
        : undefined,
  };
  delete summary.participantMeta; // internal bookkeeping, not part of the API
  return summary;
}

async function teamCountMap(hackathonIds) {
  const counts = await Team.aggregate([
    { $match: { hackathon: { $in: hackathonIds } } },
    { $group: { _id: '$hackathon', count: { $sum: 1 } } },
  ]);
  return new Map(counts.map((c) => [String(c._id), c.count]));
}

// GET /api/hackathons?search=&skill=&status=&from=&to=
async function listHackathons(req, res) {
  const { search, skill, status, from, to } = req.query;
  const filter = {};

  if (search) {
    const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ title: rx }, { description: rx }];
  }
  if (skill) filter.requiredSkills = { $in: [skill] };
  if (from || to) {
    filter.startDate = {};
    if (from) filter.startDate.$gte = new Date(from);
    if (to) filter.startDate.$lte = new Date(to);
  }

  const hackathons = await Hackathon.find(filter)
    .populate('host', 'name organization email')
    .sort({ startDate: 1 });

  let list = hackathons;
  if (status === 'open' || status === 'closed') {
    list = hackathons.filter(
      (h) => (registrationClosed(h) ? 'closed' : 'open') === status
    );
  }

  const counts = await teamCountMap(list.map((h) => h._id));
  const out = list.map((h) => {
    const s = summarize(h, counts, req.user);
    if (s.isRegistered === undefined) delete s.isRegistered;
    return s;
  });
  return res.status(200).json({ hackathons: out });
}

// GET /api/hackathons/:id
async function getHackathon(req, res) {
  const hackathon = await Hackathon.findById(req.params.id).populate(
    'host',
    'name organization email'
  );
  if (!hackathon) throw httpError(404, 'Hackathon not found');

  const counts = await teamCountMap([hackathon._id]);
  const summary = summarize(hackathon, counts, req.user);
  if (summary.isRegistered === undefined) delete summary.isRegistered;

  let myTeam = null;
  if (req.user && req.user.role === 'student') {
    const team = await Team.findOne({
      hackathon: hackathon._id,
      members: req.user.id,
    }).select('_id');
    myTeam = team ? String(team._id) : null;
  }

  return res.status(200).json({ hackathon: summary, myTeam });
}

// POST /api/hackathons/:id/register (student)
async function registerForHackathon(req, res) {
  const hackathon = await Hackathon.findById(req.params.id);
  if (!hackathon) throw httpError(404, 'Hackathon not found');

  const already = hackathon.participants.some(
    (p) => String(p._id || p) === String(req.user.id)
  );
  if (already) throw httpError(400, 'You are already registered for this hackathon');

  if (registrationClosed(hackathon)) {
    throw httpError(400, 'Registration is closed for this hackathon');
  }

  hackathon.participants.push(req.user.id);
  if (!hackathon.participantMeta) hackathon.participantMeta = new Map();
  hackathon.participantMeta.set(String(req.user.id), new Date());
  await hackathon.save();

  return res.status(200).json({ message: 'Registered successfully' });
}

// POST /api/hackathons (host)
async function createHackathon(req, res) {
  const hackathon = await Hackathon.create({
    ...req.body,
    host: req.user.id,
  });
  const populated = await hackathon.populate('host', 'name organization email');
  const summary = summarize(populated, new Map(), req.user);
  delete summary.isRegistered;
  return res.status(201).json({ hackathon: summary });
}

async function loadOwnedHackathon(req) {
  const hackathon = await Hackathon.findById(req.params.id);
  if (!hackathon) throw httpError(404, 'Hackathon not found');
  if (String(hackathon.host) !== String(req.user.id)) {
    throw httpError(403, 'You do not own this hackathon');
  }
  return hackathon;
}

// PUT /api/hackathons/:id (host, owner only)
async function updateHackathon(req, res) {
  const hackathon = await loadOwnedHackathon(req);
  const allowed = [
    'title',
    'description',
    'bannerUrl',
    'startDate',
    'endDate',
    'registrationDeadline',
    'teamFormationDeadline',
    'mode',
    'venue',
    'prize',
    'teamSizeLimit',
    'requiredSkills',
    'isOpen',
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) hackathon[key] = req.body[key];
  }
  await hackathon.save();
  const populated = await hackathon.populate('host', 'name organization email');
  const summary = summarize(populated, await teamCountMap([hackathon._id]), req.user);
  delete summary.isRegistered;
  return res.status(200).json({ hackathon: summary });
}

// DELETE /api/hackathons/:id (host, owner only) — cascades.
async function deleteHackathon(req, res) {
  const hackathon = await loadOwnedHackathon(req);
  const teams = await Team.find({ hackathon: hackathon._id }).select('_id');
  const teamIds = teams.map((t) => t._id);

  await TeamRequest.deleteMany({ team: { $in: teamIds } });
  await Team.deleteMany({ hackathon: hackathon._id });
  await Announcement.deleteMany({ hackathon: hackathon._id });
  await Notification.deleteMany({
    $or: [
      { link: `/hackathons/${hackathon._id}` },
      { link: { $in: teamIds.map((id) => `/teams/${id}`) } },
    ],
  });
  await hackathon.deleteOne();

  return res.status(200).json({ message: 'Hackathon deleted' });
}

// GET /api/hackathons/:id/participants?skill=&college=&search= (host, owner)
async function getParticipants(req, res) {
  const hackathon = await loadOwnedHackathon(req);
  const { skill, college, search } = req.query;

  await hackathon.populate({
    path: 'participants',
    select: 'name email college branch year skills github linkedin bio createdAt',
  });

  let participants = hackathon.participants || [];
  if (skill) {
    const s = skill.toLowerCase();
    participants = participants.filter((u) =>
      (u.skills || []).some((k) => k.name.toLowerCase() === s)
    );
  }
  if (college) {
    const c = college.toLowerCase();
    participants = participants.filter((u) => (u.college || '').toLowerCase().includes(c));
  }
  if (search) {
    const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    participants = participants.filter(
      (u) => rx.test(u.name || '') || rx.test(u.email || '') || rx.test(u.college || '')
    );
  }

  return res.status(200).json({ participants });
}

// GET /api/hackathons/:id/teams (host, owner)
async function getHackathonTeams(req, res) {
  const hackathon = await loadOwnedHackathon(req);
  const teams = await Team.find({ hackathon: hackathon._id })
    .populate('members', 'name email college branch year skills github linkedin')
    .populate('owner', 'name email')
    .sort({ createdAt: -1 });
  return res.status(200).json({ teams });
}

// GET /api/hackathons/:id/participants/export (host, owner) → CSV
async function exportParticipants(req, res) {
  const hackathon = await loadOwnedHackathon(req);
  await hackathon.populate({
    path: 'participants',
    select: 'name email college branch year skills github linkedin createdAt',
  });

  const headers = [
    'name',
    'email',
    'college',
    'branch',
    'year',
    'skills',
    'github',
    'linkedin',
    'registeredAt',
  ];
  const rows = (hackathon.participants || []).map((u) => {
    const skills = (u.skills || []).map((s) => `${s.name} (${s.level})`).join('; ');
    const meta = hackathon.participantMeta && hackathon.participantMeta.get(String(u._id));
    return [
      u.name,
      u.email,
      u.college,
      u.branch,
      u.year,
      skills,
      u.github,
      u.linkedin,
      (meta || u.createdAt || new Date()).toISOString(),
    ];
  });

  const csv = toCsv(headers, rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="hackathon-${hackathon._id}-participants.csv"`
  );
  return res.status(200).send(csv);
}

// GET /api/hackathons/:id/announcements (auth; students must be registered, host must own)
async function listAnnouncements(req, res) {
  const hackathon = await Hackathon.findById(req.params.id);
  if (!hackathon) throw httpError(404, 'Hackathon not found');

  if (req.user.role === 'host') {
    if (String(hackathon.host) !== String(req.user.id)) {
      throw httpError(403, 'You do not own this hackathon');
    }
  } else {
    const registered = hackathon.participants.some(
      (p) => String(p._id || p) === String(req.user.id)
    );
    if (!registered) throw httpError(403, 'You must be registered to view announcements');
  }

  const announcements = await Announcement.find({ hackathon: hackathon._id })
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 });
  return res.status(200).json({ announcements });
}

// POST /api/hackathons/:id/announcements (host, owner)
async function createAnnouncement(req, res) {
  const hackathon = await loadOwnedHackathon(req);
  const { title, body } = req.body;

  const announcement = await Announcement.create({
    hackathon: hackathon._id,
    title,
    body,
    createdBy: req.user.id,
  });

  await notifyAnnouncement(hackathon, announcement);

  return res.status(201).json({ announcement });
}

module.exports = {
  listHackathons: asyncHandler(listHackathons),
  getHackathon: asyncHandler(getHackathon),
  registerForHackathon: asyncHandler(registerForHackathon),
  createHackathon: asyncHandler(createHackathon),
  updateHackathon: asyncHandler(updateHackathon),
  deleteHackathon: asyncHandler(deleteHackathon),
  getParticipants: asyncHandler(getParticipants),
  getHackathonTeams: asyncHandler(getHackathonTeams),
  exportParticipants: asyncHandler(exportParticipants),
  listAnnouncements: asyncHandler(listAnnouncements),
  createAnnouncement: asyncHandler(createAnnouncement),
};
