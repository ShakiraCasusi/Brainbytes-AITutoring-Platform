import axios from 'axios';

export const API_BASE_URL = (() => {
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (envUrl && envUrl !== 'undefined' && envUrl !== '' && envUrl !== 'null') {
      return envUrl;
    }
    const hostname = window.location.hostname;
    if (hostname.includes('railway.app')) {
      const backendHostname = hostname.replace('frontend', 'backend');
      return `https://${backendHostname}/api`;
    }
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
})();
export const WS_URL = API_BASE_URL.replace(/^http/, 'ws').replace(
  /\/api$/,
  '/ws'
);

export function getToken() {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('brainbytesToken') || '';
}

export function setToken(token) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('brainbytesToken', token);
  }
}

export const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
