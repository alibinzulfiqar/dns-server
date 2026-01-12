import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

// Domains API
export const domainsAPI = {
  getAll: (params) => api.get('/domains', { params }),
  getOne: (id) => api.get(`/domains/${id}`),
  create: (data) => api.post('/domains', data),
  update: (id, data) => api.put(`/domains/${id}`, data),
  delete: (id) => api.delete(`/domains/${id}`),
  getStats: () => api.get('/domains/stats'),
};

// Records API
export const recordsAPI = {
  getAll: (domainId, params) => api.get(`/domains/${domainId}/records`, { params }),
  getOne: (domainId, id) => api.get(`/domains/${domainId}/records/${id}`),
  create: (domainId, data) => api.post(`/domains/${domainId}/records`, data),
  bulkCreate: (domainId, records) => api.post(`/domains/${domainId}/records/bulk`, { records }),
  update: (domainId, id, data) => api.put(`/domains/${domainId}/records/${id}`, data),
  delete: (domainId, id) => api.delete(`/domains/${domainId}/records/${id}`),
};

export default api;
