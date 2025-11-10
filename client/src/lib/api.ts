// API Configuration
// Auto-detect API URL: use VITE_API_URL if set and not a placeholder,
// otherwise use current origin (works when frontend/backend are same server)
function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If VITE_API_URL is set and not a placeholder, use it
  if (envUrl && !envUrl.includes('your-app-name') && !envUrl.includes('your-deployed-url')) {
    return envUrl;
  }
  
  // In browser, use current origin (works for same-server deployments)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // Fallback for SSR or build time
  return 'http://localhost:5000';
}

const API_BASE_URL = getApiBaseUrl();

export const api = {
  baseUrl: API_BASE_URL,
  
  // Community endpoints
  communities: {
    getAll: () => `${API_BASE_URL}/api/communities`,
    getById: (id: string) => `${API_BASE_URL}/api/communities/${id}`,
    create: () => `${API_BASE_URL}/api/communities`,
    update: (id: string) => `${API_BASE_URL}/api/communities/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/communities/${id}`,
    assignLeader: (id: string) => `${API_BASE_URL}/api/communities/${id}/assign-leader`,
    removeLeader: (id: string) => `${API_BASE_URL}/api/communities/${id}/remove-leader`,
  },
  
  // User endpoints
  users: {
    getAll: () => `${API_BASE_URL}/api/users`,
    getById: (id: string) => `${API_BASE_URL}/api/users/${id}`,
    create: () => `${API_BASE_URL}/api/users`,
    update: (id: string) => `${API_BASE_URL}/api/users/${id}`,
    delete: (id: string) => `${API_BASE_URL}/api/users/${id}`,
  },
};

export default api;
