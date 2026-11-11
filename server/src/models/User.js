const mongoose = require('mongoose');

const { Schema } = mongoose;

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const PREFERRED_ROLES = ['Developer', 'Designer', 'Data Scientist', 'Researcher', 'Presenter'];
const AVAILABILITY_STATUSES = ['available', 'busy'];
const VISIBILITY_STATUSES = ['public', 'hidden'];

const skillSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    level: { type: String, enum: SKILL_LEVELS, default: 'Beginner' },
  },
  { _id: false }
);

const pastProjectSchema = new Schema(
  {
    title: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    link: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, index: true, unique: true },
    passwordHash: { type: String, select: false }, // empty for Google-only accounts
    googleId: { type: String, unique: true, sparse: true, select: false },
    role: { type: String, enum: ['student', 'host'], required: true },

    // student profile
    avatarUrl: { type: String, trim: true, default: '' },
    college: { type: String, trim: true, default: '' },
    university: { type: String, trim: true, default: '' },
    branch: { type: String, trim: true, default: '' },
    year: { type: Number, min: 1, max: 6, default: null },
    skills: { type: [skillSchema], default: [] },
    interests: { type: [String], default: [] },
    preferredRoles: {
      type: [String],
      enum: PREFERRED_ROLES,
      default: ['Developer'],
    },
    experienceLevel: {
      type: String,
      enum: SKILL_LEVELS,
      default: 'Beginner',
    },
    availability: {
      type: String,
      enum: AVAILABILITY_STATUSES,
      default: 'available',
    },
    pastProjects: { type: [pastProjectSchema], default: [] },
    achievements: { type: [String], default: [] },
    github: { type: String, trim: true, default: '' },
    linkedin: { type: String, trim: true, default: '' },
    bio: { type: String, trim: true, maxlength: 1000, default: '' },
    profileVisibility: {
      type: String,
      enum: VISIBILITY_STATUSES,
      default: 'public',
      index: true,
    },
    onboardingCompleted: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },

    // host profile
    organization: { type: String, trim: true, default: '' },
    hostStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'approved',
    },
    hostStatusNote: { type: String, trim: true, default: '' },
    isAdmin: { type: Boolean, default: false },
    termsAcceptedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes for search and discovery
userSchema.index({ name: 'text', college: 'text', branch: 'text', bio: 'text' });
userSchema.index({ 'skills.name': 1 });
userSchema.index({ role: 1, profileVisibility: 1 });

// Never leak the password hash through JSON responses.
function stripSecrets(doc, ret) {
  delete ret.passwordHash;
  delete ret.googleId;
  delete ret.__v;
  return ret;
}
userSchema.set('toJSON', { transform: stripSecrets });
userSchema.set('toObject', { transform: stripSecrets });

module.exports = mongoose.model('User', userSchema);
module.exports.SKILL_LEVELS = SKILL_LEVELS;
module.exports.PREFERRED_ROLES = PREFERRED_ROLES;
module.exports.AVAILABILITY_STATUSES = AVAILABILITY_STATUSES;
module.exports.VISIBILITY_STATUSES = VISIBILITY_STATUSES;
