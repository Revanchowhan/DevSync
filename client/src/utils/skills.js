// Skills may be stored as legacy strings or as { name, level } objects.

/** Return a usable display name for either supported skill shape. */
export function skillLabel(skill) {
  if (typeof skill === 'string') return skill.trim()
  if (skill && typeof skill === 'object' && typeof skill.name === 'string') return skill.name.trim()
  return ''
}

/** Normalize, remove invalid/duplicate entries, and preserve valid levels. */
export function normalizeSkills(list) {
  if (!Array.isArray(list)) return []

  const seen = new Set()
  const normalized = []
  for (const skill of list) {
    const name = skillLabel(skill)
    if (!name) continue

    const key = name.toLocaleLowerCase()
    if (seen.has(key)) continue
    seen.add(key)

    const level = skill && typeof skill === 'object' && typeof skill.level === 'string'
      ? skill.level.trim()
      : ''
    normalized.push(level ? { name, level } : { name })
  }
  return normalized
}

/** Convert a mixed list to safe string labels for rendering. */
export function skillLabels(list) {
  return normalizeSkills(list).map(({ name }) => name)
}

/** Safely return the first word of a user's name. */
export function firstName(user, fallback = 'there') {
  const name = typeof user?.name === 'string' ? user.name.trim() : ''
  return name ? name.split(/\s+/)[0] : fallback
}
