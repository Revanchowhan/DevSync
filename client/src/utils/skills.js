export function skillLabel(skill) {
  if (typeof skill === 'string') return skill.trim()
  if (skill && typeof skill === 'object' && typeof skill.name === 'string') return skill.name.trim()
  return ''
}

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

export function skillLabels(list) {
  return normalizeSkills(list).map(({ name }) => name)
}

export function firstName(user, fallback = 'there') {
  const name = typeof user?.name === 'string' ? user.name.trim() : ''
  return name ? name.split(/\s+/)[0] : fallback
}
