// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
