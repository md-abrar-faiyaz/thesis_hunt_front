// Centralized API base URL supporting deployment overrides via VITE_API_BASE_URL env variable
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

const defaultBackendUrl = isLocalhost 
  ? 'http://localhost:8000' 
  : 'https://thesis-hunt-back.onrender.com'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || defaultBackendUrl

