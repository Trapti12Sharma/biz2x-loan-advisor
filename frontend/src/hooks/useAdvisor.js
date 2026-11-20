import { useState, useCallback, useEffect } from 'react'
import { getRecommendations, getProfile } from '../services/api'

// Custom hook: shared state + actions for the whole advisor flow.
export function useAdvisor() {
  const [profile, setProfile] = useState(null) // last submitted (validated) profile
  const [result, setResult] = useState(null) // response of /recommendations
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null) // { message, details }

  // On sign-in, restore this user's saved profile (stored server-side) and its results.
  useEffect(() => {
    let cancelled = false
    getProfile()
      .then(({ profile: saved }) => (saved ? getRecommendations(saved) : null))
      .then((data) => {
        if (!cancelled && data) {
          setProfile(data.profile)
          setResult(data)
        }
      })
      .catch(() => {}) // restoring is best-effort; the user can just fill the form
    return () => { cancelled = true }
  }, [])

  const submitProfile = useCallback(async (p) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getRecommendations(p)
      setProfile(data.profile) // use the backend-normalized profile
      setResult(data)
      return true
    } catch (err) {
      setError({ message: err.message, details: err.details || [] })
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  return { profile, result, loading, error, submitProfile }
}
