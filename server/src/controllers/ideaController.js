const mongoose = require('mongoose');
const Idea = require('../models/Idea');
const Team = require('../models/Team');
const User = require('../models/User');
const { createNotification } = require('../services/notificationService');
const { asyncHandler, httpError } = require('../middleware/errorHandler');
const { toPublicStudent } = require('../utils/serializers');
const { normalizeSkill } = require('../utils/skills');
const { escapeRegex } = require('../utils/sanitize');

async function createIdea(req, res) {
  if (req.user.role !== 'student') {
    throw httpError(403, 'Only students can publish project ideas.');
  }

  const {
    title,
    description,
    domain,
    requiredSkills,
    preferredRoles,
    teamSize = 4,
    hackathonId,
  } = req.body;

  const normalizedSkills = Array.isArray(requiredSkills)
    ? requiredSkills.map((s) => ({
        name: normalizeSkill(typeof s === 'string' ? s : s.name),
      }))
    : [];

  const idea = await Idea.create({
    title,
    description,
    domain,
    requiredSkills: normalizedSkills,
    preferredRoles: preferredRoles || ['Developer'],
    teamSize: Math.min(10, Math.max(2, parseInt(teamSize, 10) || 4)),
    hackathon: hackathonId || null,
    owner: req.user.id,
    members: [{ user: req.user.id, role: 'Leader', joinedAt: new Date() }],
    status: 'open',
  });

  return res.status(201).json({ idea });
}

async function listIdeas(req, res) {
  const { search, domain, skill, status = 'open', cursor, limit: rawLimit = 20 } = req.query;
  const limit = Math.min(50, Math.max(1, parseInt(rawLimit, 10) || 20));

  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }

  if (cursor && mongoose.Types.ObjectId.isValid(cursor)) {
    filter._id = { $lt: new mongoose.Types.ObjectId(cursor) };
  }

  const andConditions = [];

  if (search && search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    andConditions.push({ $or: [{ title: rx }, { description: rx }, { domain: rx }] });
  }

  if (domain && domain.trim()) {
    andConditions.push({ domain: new RegExp(`^${escapeRegex(domain.trim())}$`, 'i') });
  }

  if (skill && skill.trim()) {
    const canonical = normalizeSkill(skill.trim());
    andConditions.push({ 'requiredSkills.name': new RegExp(`^${escapeRegex(canonical)}$`, 'i') });
  }

  if (andConditions.length > 0) {
    filter.$and = andConditions;
  }

  const rawIdeas = await Idea.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .populate('owner')
    .populate('members.user')
    .lean();

  const hasMore = rawIdeas.length > limit;
  const slicedIdeas = hasMore ? rawIdeas.slice(0, limit) : rawIdeas;
  const nextCursor =
    hasMore && slicedIdeas.length > 0 ? slicedIdeas[slicedIdeas.length - 1]._id.toString() : null;

  const ideas = slicedIdeas.map((idea) => {
    return {
      ...idea,
      owner: toPublicStudent(idea.owner) || { name: 'Student Builder' },
      members: (idea.members || []).map((m) => ({
        ...m,
        user: toPublicStudent(m.user) || { name: 'Member' },
      })),
      interestedCount: (idea.interested || []).length,
      // Hide private applicant notes from public list
      interested: undefined,
    };
  });

  return res.status(200).json({ ideas, nextCursor, hasMore });
}

async function getIdea(req, res) {
  const idea = await Idea.findById(req.params.id)
    .populate('owner')
    .populate('members.user')
    .populate('interested.user');

  if (!idea) throw httpError(404, 'Idea not found.');

  const isOwner = String(idea.owner._id || idea.owner) === String(req.user.id);
  const ideaObj = idea.toObject();

  ideaObj.owner = toPublicStudent(ideaObj.owner);
  ideaObj.members = (ideaObj.members || []).map((m) => ({
    ...m,
    user: toPublicStudent(m.user),
  }));

  if (isOwner) {
    ideaObj.interested = (ideaObj.interested || []).map((entry) => ({
      ...entry,
      user: toPublicStudent(entry.user),
    }));
  } else {
    // Non-owners only see if they personally applied
    const myApp = (ideaObj.interested || []).find(
      (entry) => String(entry.user?._id || entry.user) === String(req.user.id)
    );
    ideaObj.interestedCount = (ideaObj.interested || []).length;
    ideaObj.myApplication = myApp
      ? { status: myApp.status, message: myApp.message, createdAt: myApp.createdAt }
      : null;
    delete ideaObj.interested;
  }

  return res.status(200).json({ idea: ideaObj });
}

async function expressInterest(req, res) {
  const { id } = req.params;
  const { message = '' } = req.body;
  const userId = req.user.id;

  const idea = await Idea.findById(id);
  if (!idea) throw httpError(404, 'Idea not found.');

  if (idea.status !== 'open') {
    throw httpError(409, 'This idea is closed and no longer accepting teammates.');
  }

  if (String(idea.owner) === String(userId)) {
    throw httpError(400, 'You cannot express interest in your own idea.');
  }

  const isMember = (idea.members || []).some((m) => String(m.user) === String(userId));
  if (isMember) {
    throw httpError(400, 'You are already a member of this project idea.');
  }

  const existingInterest = (idea.interested || []).find((i) => String(i.user) === String(userId));
  if (existingInterest) {
    if (existingInterest.status === 'pending') {
      throw httpError(409, 'You have already submitted interest for this idea.');
    }
    if (existingInterest.status === 'accepted') {
      throw httpError(409, 'Your interest has already been accepted.');
    }
    // Update previous declined application
    existingInterest.status = 'pending';
    existingInterest.message = message;
    existingInterest.createdAt = new Date();
  } else {
    idea.interested.push({
      user: userId,
      message,
      status: 'pending',
      createdAt: new Date(),
    });
  }

  await idea.save();

  await createNotification({
    user: idea.owner,
    title: 'New Idea Teammate Interest',
    body: `${req.user.name || 'A student'} expressed interest in your project "${idea.title}".`,
    type: 'idea_interest',
    link: `/ideas/${idea._id}`,
  });

  return res.status(201).json({ message: 'Interest expressed successfully.' });
}

async function decideInterest(req, res) {
  const { id, applicantId } = req.params;
  const { status } = req.body; // 'accepted' | 'declined'

  if (!['accepted', 'declined'].includes(status)) {
    throw httpError(400, "Status must be either 'accepted' or 'declined'.");
  }

  const idea = await Idea.findById(id);
  if (!idea) throw httpError(404, 'Idea not found.');

  if (String(idea.owner) !== String(req.user.id)) {
    throw httpError(403, 'Only the idea owner can accept or decline team interest.');
  }

  const application = (idea.interested || []).find(
    (entry) => String(entry.user) === String(applicantId)
  );
  if (!application) {
    throw httpError(404, 'Interest application from this student not found.');
  }

  application.status = status;

  if (status === 'accepted') {
    const alreadyMember = (idea.members || []).some(
      (m) => String(m.user) === String(applicantId)
    );
    if (!alreadyMember) {
      if ((idea.members || []).length >= idea.teamSize) {
        throw httpError(400, `Cannot add member: idea teamSize limit of ${idea.teamSize} reached.`);
      }
      idea.members.push({
        user: applicantId,
        role: 'Collaborator',
        joinedAt: new Date(),
      });
    }
  }

  await idea.save();

  await createNotification({
    user: applicantId,
    title: status === 'accepted' ? 'Idea Interest Accepted 🎉' : 'Idea Application Update',
    body:
      status === 'accepted'
        ? `You were accepted to collaborate on "${idea.title}"!`
        : `Your application to collaborate on "${idea.title}" was declined.`,
    type: status === 'accepted' ? 'request_accepted' : 'request_declined',
    link: `/ideas/${idea._id}`,
  });

  return res.status(200).json({ idea });
}

async function convertIdeaToTeam(req, res) {
  const { id } = req.params;
  const idea = await Idea.findById(id);
  if (!idea) throw httpError(404, 'Idea not found.');

  if (String(idea.owner) !== String(req.user.id)) {
    throw httpError(403, 'Only the idea owner can convert this idea to an official team.');
  }

  // Idempotent: return existing team if already converted
  if (idea.convertedTeam) {
    const existingTeam = await Team.findById(idea.convertedTeam);
    if (existingTeam) {
      return res.status(200).json({ team: existingTeam, alreadyConverted: true });
    }
  }

  // Build member ids set ensuring owner is present
  const memberIdSet = new Set();
  memberIdSet.add(idea.owner.toString());
  (idea.members || []).forEach((m) => {
    if (m.user) memberIdSet.add(m.user.toString());
  });

  const memberIds = Array.from(memberIdSet);
  if (memberIds.length > idea.teamSize) {
    throw httpError(400, `Team member count exceeds idea teamSize limit (${idea.teamSize}).`);
  }

  const team = await Team.create({
    hackathon: idea.hackathon || null,
    name: idea.title.slice(0, 80),
    description: idea.description,
    owner: idea.owner,
    members: memberIds,
    maxMembers: idea.teamSize,
    convertedFromIdea: idea._id,
    isOpen: memberIds.length < idea.teamSize,
  });

  idea.status = 'closed';
  idea.convertedTeam = team._id;
  await idea.save();

  // Notify all members
  for (const mId of memberIds) {
    if (mId !== req.user.id) {
      await createNotification({
        user: mId,
        title: 'Team Created from Project Idea 🚀',
        body: `Project "${idea.title}" is now an official team! View your new workspace.`,
        type: 'team_joined',
        link: `/teams/${team._id}`,
      });
    }
  }

  return res.status(201).json({ team });
}

async function closeIdea(req, res) {
  const { id } = req.params;
  const idea = await Idea.findById(id);
  if (!idea) throw httpError(404, 'Idea not found.');

  if (String(idea.owner) !== String(req.user.id)) {
    throw httpError(403, 'Only the idea owner can close this idea.');
  }

  idea.status = 'closed';
  await idea.save();

  return res.status(200).json({ message: 'Idea closed.', idea });
}

module.exports = {
  createIdea: asyncHandler(createIdea),
  listIdeas: asyncHandler(listIdeas),
  getIdea: asyncHandler(getIdea),
  expressInterest: asyncHandler(expressInterest),
  decideInterest: asyncHandler(decideInterest),
  convertIdeaToTeam: asyncHandler(convertIdeaToTeam),
  closeIdea: asyncHandler(closeIdea),
};
