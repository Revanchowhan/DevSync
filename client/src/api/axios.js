import axios from 'axios'

export const AUTH_KEY = 'devsync_auth'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

/** Read the persisted { token, user } pair, or null. */
export function getAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY) || localStorage.getItem('hackmate_auth')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveAuth(payload) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(payload))
}

export function clearAuth() {
  localStorage.removeItem(AUTH_KEY)
  localStorage.removeItem('hackmate_auth')
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const auth = getAuth()
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    const url = err?.config?.url || ''
    if (status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      clearAuth()
      window.dispatchEvent(new Event('devsync:unauthorized'))
      window.dispatchEvent(new Event('hackmate:unauthorized'))
    }
    return Promise.reject(err)
  }
)

/** Return a plain string message from common backend error shapes. */
export function apiError(err, fallback = 'Something went wrong. Please try again.') {
  const payload = err?.response?.data
  const nestedError = payload && typeof payload.error === 'object' ? payload.error : null

  if (typeof payload?.error === 'string') return payload.error
  if (nestedError && typeof nestedError.message === 'string') return nestedError.message
  if (Array.isArray(payload?.error) && payload.error.length) return String(payload.error[0])
  if (typeof payload?.message === 'string') return payload.message
  if (Array.isArray(payload?.message) && payload.message.length) return payload.message.join(', ')
  if (typeof err?.message === 'string') return err.message
  if (typeof err?.response?.statusText === 'string') return err.response.statusText

  return fallback
}

export function toQuery(params) {
  const q = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, v)
  })
  return q.toString()
}

export default api
