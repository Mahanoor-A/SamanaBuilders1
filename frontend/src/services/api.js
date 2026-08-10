import axios from 'axios';

const api = axios.create({
  baseURL: '/api/',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const projectService = {
  getAll: () => api.get('/projects/'),
  getById: (id) => api.get(`/projects/${id}/`),
};

export const customerService = {
  getAll: (params) => api.get('/customers/', { params }),
  getById: (id) => api.get(`/customers/${id}/`),
  create: (data) => api.post('/customers/', data),
  update: (id, data) => api.put(`/customers/${id}/`, data),
  delete: (id) => api.delete(`/customers/${id}/`),
};

export const customerProfileAPI = {
  create: (data) => api.post('/customer-profiles/', data),
};

export const authAPI = {
  init: () => api.get('/auth/csrf/'),
  login: (data) => api.post('/auth/login/', data),
  logout: () => api.post('/auth/logout/'),
  me: () => api.get('/auth/me/'),
};

export const portalAPI = {
  dashboard: () => api.get('/portal/'),
};

export const plotService = {
  getAll: () => api.get('/plots/'),
};

export const paymentAPI = {
  getAll: (params) => api.get('/payments/', { params }),
  getById: (id) => api.get(`/payments/${id}/`),
  create: (data) => api.post('/payments/', data),
  update: (id, data) => api.put(`/payments/${id}/`, data),
  verify: (id, data) => api.post(`/payments/${id}/verify/`, data),
  markBounced: (id, data) => api.post(`/payments/${id}/mark_bounced/`, data),
  delete: (id) => api.delete(`/payments/${id}/`),
  getAttachments: (paymentId) => api.get(`/payments/${paymentId}/attachments/`),
};

export const bookingPaymentAPI = {
  getPaymentSummary: (bookingId) => api.get(`/bookings/${bookingId}/payment-summary/`),
};

export default api;
