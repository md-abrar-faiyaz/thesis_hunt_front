const defaultHost = typeof window !== 'undefined' && window.location && window.location.hostname ? window.location.hostname : 'localhost'
const localBaseUrl = `http://${defaultHost}:8000`

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (
  typeof window !== 'undefined' && window.location && window.location.hostname.includes('web.app')
    ? 'https://thesis-hunt-back.onrender.com'
    : localBaseUrl
)
