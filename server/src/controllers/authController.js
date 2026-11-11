const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { signToken } = require('../middleware/auth');
const { asyncHandler, httpError } = require('../middleware/errorHandler');
const { normalizeSkillObject } = require('../utils/skills');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const BCRYPT_ROUNDS = 12;
const SAFE_USER_FIELDS =
  'name email role college branch year skills github linkedin bio organization hostStatus isAdmin createdAt';

// Host approval gate: pending/rejected hosts get no session until an admin
// approves them. Returns an httpError to throw, or null when access is fine.
function hostGateError(user) {
  if (user.role !== 'host' || user.hostStatus === 'approved') return null;
  if (user.hostStatus === 'pending') {
    return httpError(
      403,
      'Your host account is pending approval. An admin needs to approve it before you can log in — please check back soon.'
    );
  }
  return httpError(
    403,
    'Your host account was not approved. Please contact the HackMate admin if you think this is a mistake.'
  );
}

async function registerStudent(req, res) {
  const { name, email, password, college, branch, year, skills, github, linkedin, bio } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw httpError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: 'student',
    college,
    branch,
    year,
    skills: Array.isArray(skills) ? skills.map(normalizeSkillObject).filter(Boolean) : [],
    github,
    linkedin,
    bio,
    termsAcceptedAt: new Date(),
  });

  const token = signToken(user);
  return res.status(201).json({ token, user: user.toJSON() });
}

async function registerHost(req, res) {
  const { name, organization, email, password } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw httpError(409, 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: 'host',
    organization,
    hostStatus: 'pending',
    termsAcceptedAt: new Date(),
  });

  // No token yet: the account becomes usable only after admin approval.
  return res.status(201).json({ pendingApproval: true, user: user.toJSON() });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await User.findOne({ email: String(email).toLowerCase() }).select(
    `+passwordHash ${SAFE_USER_FIELDS}`
  );
  if (!user) throw httpError(401, 'Invalid email or password');

  const ok = user.passwordHash
    ? await bcrypt.compare(password, user.passwordHash)
    : false;
  if (!ok) {
    if (!user.passwordHash) throw httpError(401, 'This account uses Google sign-in. Please continue with Google.');
    throw httpError(401, 'Invalid email or password');
  }

  const gate = hostGateError(user);
  if (gate) throw gate;

  const token = signToken(user);
  const safe = user.toObject();
  delete safe.passwordHash;
  return res.status(200).json({ token, user: safe });
}

async function googleAuth(req, res) {
  if (!process.env.GOOGLE_CLIENT_ID) throw httpError(500, 'Google sign-in is not configured on the server');

  const {
    idToken,
    mode = 'signup',
    role = 'student',
    college,
    branch,
    year,
    skills,
    github,
    linkedin,
    bio,
    organization,
  } = req.body;

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch (err) {
    throw httpError(401, 'Invalid Google credential. Please try again.');
  }
  if (!payload || payload.email_verified !== true) {
    throw httpError(401, 'Your Google email is not verified.');
  }

  const googleId = payload.sub;
  const email = String(payload.email).toLowerCase();

  let user = await User.findOne({ googleId });
  if (!user) {
    // Link Google to an existing email account when the email is verified.
    user = await User.findOne({ email });
    if (user) {
      user.googleId = googleId;
      await user.save();
    }
  }

  if (!user) {
    if (mode === 'login') {
      throw httpError(404, 'No account found for this Google email. Please sign up first.');
    }
    const finalRole = role === 'host' ? 'host' : 'student';
    if (finalRole === 'student' && (!college || !branch || !year)) {
      throw httpError(400, 'College, branch and year are required to create a student account');
    }
    if (finalRole === 'host' && !organization) {
      throw httpError(400, 'Organization is required to create a host account');
    }
    user = await User.create({
      name: (payload.name || email.split('@')[0]).trim(),
      email,
      googleId,
      role: finalRole,
      termsAcceptedAt: new Date(),
      ...(finalRole === 'student'
        ? {
            college,
            branch,
            year,
            skills: Array.isArray(skills) ? skills.map(normalizeSkillObject).filter(Boolean) : [],
            github,
            linkedin,
            bio,
          }
        : { organization, hostStatus: 'pending' }),
    });
    if (finalRole === 'host') {
      // Host accounts need admin approval first — no session yet.
      return res.status(201).json({ pendingApproval: true, user: user.toJSON() });
    }
    const token = signToken(user);
    return res.status(201).json({ token, user: user.toJSON() });
  }

  const gate = hostGateError(user);
  if (gate) throw gate;

  const token = signToken(user);
  return res.status(200).json({ token, user: user.toJSON() });
}

async function me(req, res) {
  const user = await User.findById(req.user.id);
  if (!user) throw httpError(404, 'User not found');
  return res.status(200).json({ user: user.toJSON() });
}

module.exports = {
  registerStudent: asyncHandler(registerStudent),
  registerHost: asyncHandler(registerHost),
  login: asyncHandler(login),
  googleAuth: asyncHandler(googleAuth),
  me: asyncHandler(me),
};
