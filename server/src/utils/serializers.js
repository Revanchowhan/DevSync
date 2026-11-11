const FORBIDDEN_PUBLIC_KEYS = [
  'passwordHash',
  'email',
  'tokens',
  'googleId',
  '__v',
  'isAdmin',
  'hostStatus',
  'hostStatusNote',
  'termsAcceptedAt',
  'verificationToken',
  'resetPasswordToken',
  'emailVerificationToken',
  'blockedUsers',
];

/**
 * Public serializer for student profile
 * Strict allowlist of public student fields.
 */
function toPublicStudent(user) {
  if (!user) return null;

  const raw = typeof user.toObject === 'function' ? user.toObject() : user;

  // If user profile is hidden, do not serialize as public
  if (raw.profileVisibility === 'hidden') {
    return null;
  }

  const publicData = {
    _id: raw._id ? raw._id.toString() : raw.id,
    name: raw.name || '',
    role: raw.role || 'student',
    college: raw.college || raw.university || '',
    university: raw.university || raw.college || '',
    branch: raw.branch || '',
    year: raw.year || null,
    skills: Array.isArray(raw.skills)
      ? raw.skills.map((s) => ({
          name: typeof s === 'string' ? s : s.name,
          level: s.level || 'Beginner',
        }))
      : [],
    avatarUrl: raw.avatarUrl || '',
    interests: Array.isArray(raw.interests) ? raw.interests : [],
    preferredRoles: Array.isArray(raw.preferredRoles) ? raw.preferredRoles : [],
    experienceLevel: raw.experienceLevel || 'Beginner',
    availability: raw.availability || 'available',
    pastProjects: Array.isArray(raw.pastProjects) ? raw.pastProjects : [],
    achievements: Array.isArray(raw.achievements) ? raw.achievements : [],
    github: raw.github || '',
    linkedin: raw.linkedin || '',
    bio: raw.bio || '',
    profileVisibility: raw.profileVisibility || 'public',
    onboardingCompleted: Boolean(raw.onboardingCompleted),
    emailVerified: Boolean(raw.emailVerified),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };

  // Guarantee no forbidden key is ever present
  for (const forbidden of FORBIDDEN_PUBLIC_KEYS) {
    if (Object.prototype.hasOwnProperty.call(publicData, forbidden)) {
      delete publicData[forbidden];
    }
  }

  return publicData;
}

module.exports = {
  toPublicStudent,
  FORBIDDEN_PUBLIC_KEYS,
};
