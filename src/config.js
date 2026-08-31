// Centralized API base URL supporting deployment overrides via VITE_API_BASE_URL env variable
const PROD_URL = 'https://thesis-hunt-back.onrender.com'
const LOCAL_URL = 'http://localhost:8000'

const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (isLocalhost ? LOCAL_URL : PROD_URL)

/**
 * Resilient fetch wrapper that automatically fails over to live Aiven-connected backend
 * if local backend on port 8000 is not running.
 */
export async function apiFetch(endpoint, options = {}) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const primaryUrl = `${API_BASE_URL}${cleanEndpoint}`
  
  try {
    const res = await fetch(primaryUrl, options)
    return res
  } catch (err) {
    // If primary URL was local and failed, failover to live Aiven backend
    if (API_BASE_URL !== PROD_URL) {
      const failoverUrl = `${PROD_URL}${cleanEndpoint}`
      try {
        const res = await fetch(failoverUrl, options)
        return res
      } catch (fallbackErr) {
        throw fallbackErr
      }
    }
    throw err
  }
}


