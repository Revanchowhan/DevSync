// Skills can arrive in two shapes: legacy plain strings ('React') and the
// current objects ({ name: 'React', level: 'Advanced' }). These helpers make
// every consumer tolerant of both, and of junk values.

/** Display label for a skill in either shape; '' if it has no usable name. */
export function skillLabel(skill) {
  if (typeof skill === 'string') return skill.trim()
  if (skill && typeof skill === 'object' && typeof skill.name === 'string') return skill.name.trim()
  return ''
}

/**
 * Normalize a list of skills to [{ name, level? }], dropping empties and
 * case-insensitive duplicates. Legacy strings become { name }.
 */
export function normalizeSkills(list) {
  if (!Array.isArray(list)) return []
  const seen = new Set()
  const out = []
  for (const item of list) {
    const name = skillLabel(item)
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const level = item && typeof item === 'object' && typeof item.level === 'string' ? item.level : undefined
    out.push(level ? { name, level } : { name })
  }
  return out
}

/** Safe list of display strings for rendering chips (e.g. requiredSkills). */
export function skillLabels(list) {
  return normalizeSkills(list).map((s) => s.name)
}

/** First word of a user's name, with a fallback when name is missing/malformed. */
export function firstName(user, fallback = 'there') {
  const name = user && typeof user.name === 'string' ? user.name.trim() : ''
  return name ? name.split(/\s+/)[0] : fallback
}
