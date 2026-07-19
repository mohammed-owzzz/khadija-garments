import axios from 'axios'

// API base URL comes from the environment in production (VITE_API_URL),
// and falls back to the local backend during development.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_URL,
})

// Attach the logged-in token to every request. Admin token takes precedence
// so admin dashboard actions are authorized; falls back to the customer token.
api.interceptors.request.use((config) => {
  let token = null
  try {
    const admin = JSON.parse(localStorage.getItem('khadija_admin') || 'null')
    const user  = JSON.parse(localStorage.getItem('khadija_user') || 'null')
    token = admin?.token || user?.token || null
  } catch {
    token = null
  }
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// If the server ever rejects our token, clear stale creds so the UI can re-auth.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      // token invalid/expired - handled by pages redirecting to login
    }
    return Promise.reject(err)
  }
)

export default api