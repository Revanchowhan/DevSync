import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import api, { getAuth, saveAuth, clearAuth } from '../api/axios.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getAuth())
  const [loading, setLoading] = useState(() => Boolean(getAuth()?.token))

  const user = auth?.user || null
  const token = auth?.token || null

  const applyAuth = useCallback((payload) => {
    saveAuth(payload)
    setAuth(payload)
  }, [])

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      const current = getAuth()
      if (current) {
        const next = { token: current.token, user: data.user }
        saveAuth(next)
        setAuth(next)
      }
      return data.user
    } finally {
      setLoading(false)
    }
  }, [])

  // On boot, validate the stored token and hydrate the user.
  useEffect(() => {
    if (getAuth()?.token) {
      refreshMe().catch(() => {
        clearAuth()
        setAuth(null)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [refreshMe])

  // Token expired elsewhere (api interceptor) -> log out locally.
  useEffect(() => {
    const onExpired = () => setAuth(null)
    window.addEventListener('devsync:unauthorized', onExpired)
    window.addEventListener('hackmate:unauthorized', onExpired)
    return () => {
      window.removeEventListener('devsync:unauthorized', onExpired)
      window.removeEventListener('hackmate:unauthorized', onExpired)
    }
  }, [])

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    applyAuth({ token: data.token, user: data.user })
    return data.user
  }

  const registerStudent = async (payload) => {
    const { data } = await api.post('/auth/register/student', payload)
    applyAuth({ token: data.token, user: data.user })
    return data.user
  }

  // Host signups are approval-gated: the API returns { pendingApproval: true }
  // with no token until an admin approves the account. In that case we return
  // { pendingApproval: true, user } and deliberately do NOT log the user in.
  const registerHost = async (payload) => {
    const { data } = await api.post('/auth/register/host', payload)
    if (data.pendingApproval || !data.token) {
      return { pendingApproval: true, user: data.user }
    }
    applyAuth({ token: data.token, user: data.user })
    return data.user
  }

  const googleAuth = async (payload) => {
    const { data } = await api.post('/auth/google', payload)
    if (data.pendingApproval || !data.token) {
      return { pendingApproval: true, user: data.user }
    }
    applyAuth({ token: data.token, user: data.user })
    return data.user
  }

  const logout = () => {
    clearAuth()
    setAuth(null)
  }

  const value = {
    user,
    token,
    loading,
    isAuthed: Boolean(token && user),
    isStudent: user?.role === 'student',
    isHost: user?.role === 'host',
    login,
    registerStudent,
    registerHost,
    googleAuth,
    logout,
    refreshMe,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
