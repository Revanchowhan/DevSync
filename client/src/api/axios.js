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

// Attach Bearer token from localStorage on every request.
api.interceptors.request.use((config) => {
  const auth = getAuth()
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

// Expired/invalid token -> wipe local auth and notify the app.
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

/** Extract a friendly message from an axios error shaped by the contract. */
export function apiError(err, fallback = 'Something went wrong. Please try again.') {
  return err?.response?.data?.error || fallback
}

/** Build URLSearchParams from a plain object, dropping empty values. */
export function toQuery(params) {
  const q = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') q.append(k, v)
  })
  return q.toString()
}

export default api
