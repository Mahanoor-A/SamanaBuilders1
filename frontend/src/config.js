const erpBase = import.meta.env.VITE_ERP_URL
  ? import.meta.env.VITE_ERP_URL
  : import.meta.env.PROD
    ? ''
    : 'http://localhost:8000';

export const ERP_LOGIN_URL = erpBase + '/login/';
