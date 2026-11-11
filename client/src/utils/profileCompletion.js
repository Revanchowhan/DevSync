export function calculateProfileCompletion(user) {
  if (!user) return 0;

  let score = 0;
  if (user.name && user.name.trim().length > 0) score += 10;
  if ((user.college && user.college.trim().length > 0) || (user.university && user.university.trim().length > 0)) {
    score += 10;
  }
  if (user.branch && user.year) score += 10;
  if (Array.isArray(user.skills) && user.skills.length > 0) score += 20;
  if (Array.isArray(user.preferredRoles) && user.preferredRoles.length > 0) score += 10;
  if (Array.isArray(user.interests) && user.interests.length > 0) score += 10;
  if (user.bio && user.bio.trim().length >= 10) score += 10;
  if (user.avatarUrl && user.avatarUrl.trim().length > 0) score += 10;
  if ((user.github && user.github.trim().length > 0) || (user.linkedin && user.linkedin.trim().length > 0)) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}
