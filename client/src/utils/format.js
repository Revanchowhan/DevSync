/** Shared formatting helpers. */

export function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(d) {
  if (!d) return '—'
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return '—'
  return dt.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function timeAgo(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(d)
}

/** Convert a Date/ISO string to the value format of <input type="datetime-local">. */
export function toLocalInput(d) {
  if (!d) return ''
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}T${p(dt.getHours())}:${p(dt.getMinutes())}`
}

/** Convert a datetime-local input value to ISO. Returns null when empty. */
export function fromLocalInput(v) {
  if (!v) return null
  const dt = new Date(v)
  return Number.isNaN(dt.getTime()) ? null : dt.toISOString()
}

export function skillNames(skills) {
  return (skills || []).map((s) => (typeof s === 'string' ? s : s?.name)).filter(Boolean)
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')
}

export const NOTIF_ICONS = {
  team_request: '🤝',
  request_accepted: '🎉',
  request_declined: '😕',
  announcement: '📢',
  team_joined: '🚀',
}
