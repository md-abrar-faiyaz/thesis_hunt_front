const defaultHost = typeof window !== 'undefined' && window.location && window.location.hostname ? window.location.hostname : 'localhost'
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${defaultHost}:8000`
