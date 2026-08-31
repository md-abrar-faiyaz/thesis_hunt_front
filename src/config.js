// Centralized API base URL supporting deployment overrides via VITE_API_BASE_URL env variable
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
