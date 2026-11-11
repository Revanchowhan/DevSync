const { normalizeSkill } = require('../utils/skills');

const WEIGHTS = {
  complementarity: 40,
  interests: 20,
  roleFit: 20,
  availability: 10,
  experience: 10,
};

// Validate that weights sum to exactly 100
const TOTAL_WEIGHT = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);

/**
 * Pure explainable matching calculation.
 * @param {Object} target - Current user or team looking for teammates.
 * @param {Object} candidate - Potential teammate.
 * @returns {Object} { score, breakdown: { complementarity, interests, roleFit, availability, experience }, reason }
 */
function calculateMatch(target, candidate) {
  if (!target || !candidate) {
    return {
      score: 0,
      breakdown: {
        complementarity: 0,
        interests: 0,
        roleFit: 0,
        availability: 0,
        experience: 0,
      },
      reason: 'Insufficient profile data for matching.',
    };
  }

  // 1. Skill Complementarity (40 pts)
  const candidateSkills = (candidate.skills || []).map((s) =>
    normalizeSkill(typeof s === 'string' ? s : s.name).toLowerCase()
  );
  const targetSkills = (target.skills || []).map((s) =>
    normalizeSkill(typeof s === 'string' ? s : s.name).toLowerCase()
  );

  let compScore = 0;
  let complementarySkills = [];

  if (target.missingSkills && target.missingSkills.length > 0) {
    // Matching against explicit team missing skills
    const missing = target.missingSkills.map((s) =>
      normalizeSkill(typeof s === 'string' ? s : s.name).toLowerCase()
    );
    const matched = missing.filter((m) => candidateSkills.includes(m));
    const ratio = matched.length / missing.length;
    compScore = Math.round(ratio * WEIGHTS.complementarity);
    complementarySkills = matched;
  } else {
    // Peer-to-peer student matching: candidate bringing skills target lacks
    const targetSet = new Set(targetSkills);
    const candidateUnique = candidateSkills.filter((s) => !targetSet.has(s));
    complementarySkills = candidateUnique;

    if (candidateSkills.length === 0 || targetSkills.length === 0) {
      compScore = 0;
    } else {
      // Ideal complementarity: candidate brings 2+ skills target lacks
      const coverageRatio = Math.min(1, candidateUnique.length / 3);
      compScore = Math.round(coverageRatio * WEIGHTS.complementarity);
    }
  }

  // 2. Shared Interests (20 pts)
  const targetInterests = (target.interests || []).map((i) => i.toLowerCase().trim());
  const candidateInterests = (candidate.interests || []).map((i) => i.toLowerCase().trim());
  const targetIntSet = new Set(targetInterests);
  const sharedInterests = candidateInterests.filter((i) => targetIntSet.has(i));

  let intScore = 0;
  if (targetInterests.length > 0 && candidateInterests.length > 0) {
    const ratio = Math.min(1, sharedInterests.length / Math.min(targetInterests.length, 3));
    intScore = Math.round(ratio * WEIGHTS.interests);
  }

  // 3. Role Fit (20 pts)
  // Synergy when roles are different (e.g., Developer + Designer) or complementary
  const targetRoles = (target.preferredRoles || []).map((r) => r.toLowerCase());
  const candidateRoles = (candidate.preferredRoles || []).map((r) => r.toLowerCase());

  let roleScore = 0;
  if (targetRoles.length > 0 && candidateRoles.length > 0) {
    const hasDifferentRole = candidateRoles.some((r) => !targetRoles.includes(r));
    const hasSharedRole = candidateRoles.some((r) => targetRoles.includes(r));

    if (hasDifferentRole && hasSharedRole) {
      roleScore = WEIGHTS.roleFit; // Balanced crossover
    } else if (hasDifferentRole) {
      roleScore = Math.round(WEIGHTS.roleFit * 0.9); // Complementary roles
    } else {
      roleScore = Math.round(WEIGHTS.roleFit * 0.6); // Same roles
    }
  }

  // 4. Availability (10 pts)
  let availScore = 0;
  if (candidate.availability === 'available') {
    availScore = WEIGHTS.availability;
  } else if (candidate.availability === 'busy') {
    availScore = Math.round(WEIGHTS.availability * 0.3);
  } else {
    availScore = Math.round(WEIGHTS.availability * 0.5);
  }

  // 5. Experience Alignment (10 pts)
  let expScore = 0;
  const levels = { beginner: 1, intermediate: 2, advanced: 3 };
  const targetExp = levels[(target.experienceLevel || '').toLowerCase()] || 1;
  const candidateExp = levels[(candidate.experienceLevel || '').toLowerCase()] || 1;
  const expDiff = Math.abs(targetExp - candidateExp);

  if (expDiff === 0) {
    expScore = WEIGHTS.experience;
  } else if (expDiff === 1) {
    expScore = Math.round(WEIGHTS.experience * 0.8);
  } else {
    expScore = Math.round(WEIGHTS.experience * 0.5);
  }

  const totalScore = Math.min(
    100,
    Math.max(0, compScore + intScore + roleScore + availScore + expScore)
  );

  // Generate deterministic, human-readable reason
  let reason = '';
  const targetTopSkills = (target.skills || [])
    .slice(0, 2)
    .map((s) => (typeof s === 'string' ? s : s.name))
    .join(', ');
  const candidateTopAdded = complementarySkills
    .slice(0, 2)
    .map((s) => normalizeSkill(s))
    .join(', ');

  if (totalScore >= 75) {
    if (candidateTopAdded && targetTopSkills) {
      reason = `Strong match: you bring ${targetTopSkills}, they add ${candidateTopAdded}.`;
    } else {
      reason = 'Strong match: excellent alignment across roles, goals, and availability.';
    }
  } else if (totalScore >= 50) {
    if (sharedInterests.length > 0) {
      reason = `Good match: shared interest in ${sharedInterests.slice(0, 2).join(', ')}.`;
    } else {
      reason = 'Good potential match with complementary technical and role skills.';
    }
  } else {
    reason = 'Moderate match: diverse skillsets with opportunities for cross-functional collaboration.';
  }

  return {
    score: totalScore,
    breakdown: {
      complementarity: compScore,
      interests: intScore,
      roleFit: roleScore,
      availability: availScore,
      experience: expScore,
    },
    reason,
  };
}

module.exports = {
  WEIGHTS,
  TOTAL_WEIGHT,
  calculateMatch,
};
