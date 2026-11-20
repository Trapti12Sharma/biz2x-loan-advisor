import axios from 'axios'

const TOKEN_KEY = 'loan_advisor_token'

// One configured Axios instance = one place to change base URL, timeout, headers.
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 45000, // chat can take a few seconds because the LLM is slow
  headers: { 'Content-Type': 'application/json' },
})

// ---- token handling -------------------------------------------------------
// sessionStorage is cleared when the tab closes. (Production: httpOnly cookies.)
let token = sessionStorage.getItem(TOKEN_KEY)
let unauthorizedHandler = null

export function setAuthToken(t) {
  token = t
  if (t) sessionStorage.setItem(TOKEN_KEY, t)
  else sessionStorage.removeItem(TOKEN_KEY)
}
export const getAuthToken = () => token
export function setUnauthorizedHandler(fn) { unauthorizedHandler = fn }

// Request interceptor: attach the token to every call.
client.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor: an expired/invalid token anywhere => log the user out.
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLogin = err.config?.url?.includes('/auth/login')
    if (err.response?.status === 401 && token && !isLogin) {
      setAuthToken(null)
      unauthorizedHandler?.()
    }
    return Promise.reject(err)
  }
)

// ---- error normalising ----------------------------------------------------
export class ApiError extends Error {
  constructor(message, details = []) {
    super(message)
    this.details = details
  }
}

function toApiError(err) {
  if (err.response) {
    const { error, details } = err.response.data || {}
    return new ApiError(error || 'Request failed. Please try again.', Array.isArray(details) ? details : [])
  }
  if (err.code === 'ECONNABORTED') return new ApiError('The request timed out. Please try again.')
  return new ApiError('Cannot reach the server. Is the backend running?')
}

async function request(config) {
  try {
    const res = await client(config)
    return res.data
  } catch (err) {
    throw toApiError(err)
  }
}

// ---- endpoints ------------------------------------------------------------
export const login = (email, password) => request({ method: 'post', url: '/auth/login', data: { email, password } })
export const getMe = () => request({ method: 'get', url: '/auth/me' })
export const getProducts = () => request({ method: 'get', url: '/products' })
export const getProfile = () => request({ method: 'get', url: '/profile' })
export const getRecommendations = (profile) => request({ method: 'post', url: '/recommendations', data: profile })
export const calculateEmi = (body) => request({ method: 'post', url: '/emi', data: body })
export const compareTenures = (body) => request({ method: 'post', url: '/emi/compare-tenures', data: body })
// Chat sends ONLY the message; the server supplies this user's profile and history.
export const sendChat = (message) => request({ method: 'post', url: '/chat', data: { message } })
export const getChatHistory = () => request({ method: 'get', url: '/chat/history' })
export const clearChatHistory = () => request({ method: 'delete', url: '/chat/history' })
