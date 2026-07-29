import axios from 'axios';

const api = axios.create({
  baseURL: '/api/',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
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
  create: (data) => api.post('/customers/', data),
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
