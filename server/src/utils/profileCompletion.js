/**
 * Calculates profile completion percentage based on student profile attributes.
 * Total points = 100.
 */
function calculateProfileCompletion(user) {
  if (!user) return 0;

  let score = 0;

  // Name (10)
  if (user.name && user.name.trim().length > 0) score += 10;

  // College or University (10)
  if ((user.college && user.college.trim().length > 0) || (user.university && user.university.trim().length > 0)) {
    score += 10;
  }

  // Academic Branch & Year (10)
  if (user.branch && user.year) score += 10;

  // Skills (20 for at least 1, bonus if 3+)
  if (Array.isArray(user.skills) && user.skills.length > 0) {
    score += 20;
  }

  // Preferred Roles (10)
  if (Array.isArray(user.preferredRoles) && user.preferredRoles.length > 0) {
    score += 10;
  }

  // Passion Interests (10)
  if (Array.isArray(user.interests) && user.interests.length > 0) {
    score += 10;
  }

  // Biography (10)
  if (user.bio && user.bio.trim().length >= 10) {
    score += 10;
  }

  // Avatar URL (10)
  if (user.avatarUrl && user.avatarUrl.trim().length > 0) {
    score += 10;
  }

  // Portfolio Links: GitHub or LinkedIn (10)
  if ((user.github && user.github.trim().length > 0) || (user.linkedin && user.linkedin.trim().length > 0)) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

module.exports = { calculateProfileCompletion };
