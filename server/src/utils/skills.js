// Canonical skill taxonomy and alias mapping
const CANONICAL_SKILLS = [
  'React',
  'Node.js',
  'TypeScript',
  'JavaScript',
  'Python',
  'Java',
  'C++',
  'Go',
  'Rust',
  'Swift',
  'Kotlin',
  'Flutter',
  'React Native',
  'Vue',
  'Angular',
  'Next.js',
  'Express',
  'Django',
  'Flask',
  'FastAPI',
  'Spring Boot',
  'MongoDB',
  'PostgreSQL',
  'MySQL',
  'Redis',
  'GraphQL',
  'Docker',
  'Kubernetes',
  'AWS',
  'GCP',
  'Azure',
  'Machine Learning',
  'Deep Learning',
  'Data Science',
  'Computer Vision',
  'NLP',
  'UI/UX Design',
  'Figma',
  'Tailwind CSS',
  'HTML/CSS',
  'Cybersecurity',
  'Blockchain',
  'Solidity',
  'DevOps',
  'Git',
];

const SKILL_ALIASES = {
  'react': 'React',
  'react.js': 'React',
  'reactjs': 'React',
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'ts': 'TypeScript',
  'typescript': 'TypeScript',
  'js': 'JavaScript',
  'javascript': 'JavaScript',
  'py': 'Python',
  'python': 'Python',
  'python3': 'Python',
  'cpp': 'C++',
  'c++': 'C++',
  'golang': 'Go',
  'go': 'Go',
  'vue': 'Vue',
  'vuejs': 'Vue',
  'vue.js': 'Vue',
  'next': 'Next.js',
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  'fastapi': 'FastAPI',
  'django': 'Django',
  'flask': 'Flask',
  'mongo': 'MongoDB',
  'mongodb': 'MongoDB',
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'psql': 'PostgreSQL',
  'mysql': 'MySQL',
  'redis': 'Redis',
  'docker': 'Docker',
  'k8s': 'Kubernetes',
  'kubernetes': 'Kubernetes',
  'ml': 'Machine Learning',
  'machine learning': 'Machine Learning',
  'machinelearning': 'Machine Learning',
  'dl': 'Deep Learning',
  'deep learning': 'Deep Learning',
  'ds': 'Data Science',
  'data science': 'Data Science',
  'datascience': 'Data Science',
  'nlp': 'NLP',
  'cv': 'Computer Vision',
  'ui/ux': 'UI/UX Design',
  'ui/ux design': 'UI/UX Design',
  'ui': 'UI/UX Design',
  'ux': 'UI/UX Design',
  'ui design': 'UI/UX Design',
  'ux design': 'UI/UX Design',
  'figma': 'Figma',
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'tailwind css': 'Tailwind CSS',
  'aws': 'AWS',
  'gcp': 'GCP',
  'azure': 'Azure',
  'solidity': 'Solidity',
  'blockchain': 'Blockchain',
  'devops': 'DevOps',
  'git': 'Git',
  'flutter': 'Flutter',
  'react native': 'React Native',
  'reactnative': 'React Native',
};

/**
 * Normalize skill name to canonical taxonomy if known, otherwise capitalize cleaned input.
 */
function normalizeSkill(name) {
  if (!name || typeof name !== 'string') return '';
  const trimmed = name.trim();
  const lower = trimmed.toLowerCase();
  if (SKILL_ALIASES[lower]) {
    return SKILL_ALIASES[lower];
  }
  const match = CANONICAL_SKILLS.find((s) => s.toLowerCase() === lower);
  if (match) return match;
  // If not in canonical list, format gracefully
  return trimmed;
}

const VALID_SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

function normalizeSkillObject(skill) {
  if (!skill) return null;
  const name = typeof skill === 'string' ? skill : skill.name;
  const canonicalName = normalizeSkill(name);
  if (!canonicalName) return null;

  let level = 'Beginner';
  if (skill.level) {
    const formattedLevel =
      skill.level.charAt(0).toUpperCase() + skill.level.slice(1).toLowerCase();
    if (VALID_SKILL_LEVELS.includes(formattedLevel)) {
      level = formattedLevel;
    }
  }

  return { name: canonicalName, level };
}

module.exports = {
  CANONICAL_SKILLS,
  SKILL_ALIASES,
  VALID_SKILL_LEVELS,
  normalizeSkill,
  normalizeSkillObject,
};
