import { useState, useEffect, useCallback } from 'react'
import { login as loginRequest, getMe, getAuthToken, setAuthToken, setUnauthorizedHandler } from '../services/api'

export function useAuth() {
  const [user, setUser] = useState(null)
  // If a token is already stored, we must verify it before showing the app.
  const [checking, setChecking] = useState(Boolean(getAuthToken()))

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null)) // interceptor calls this on any 401
    if (!getAuthToken()) return undefined
    let cancelled = false
    getMe()
      .then((d) => { if (!cancelled) setUser(d.user) })
      .catch(() => setAuthToken(null))
      .finally(() => { if (!cancelled) setChecking(false) })
    return () => { cancelled = true }
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await loginRequest(email, password) // throws ApiError on failure
    setAuthToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    setAuthToken(null)
    setUser(null)
  }, [])

  return { user, checking, login, logout }
}
