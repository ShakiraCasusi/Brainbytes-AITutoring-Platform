import axios from 'axios';
import { BrainBytesMonitor } from './metrics';

export const API_BASE_URL = (() => {
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    if (
      envUrl &&
      envUrl !== 'undefined' &&
      envUrl !== '' &&
      envUrl !== 'null'
    ) {
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

// --- METRICS INTERCEPTOR CONFIGURATION ---

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  config.metadata = { startTime: performance.now() };

  if (config.data) {
    const payloadString = typeof config.data === 'object' ? JSON.stringify(config.data) : String(config.data);
    const bytesSent = new Blob([payloadString]).size;
    
    BrainBytesMonitor.trackDataUsage(bytesSent, 'outbound_api_request');
  }

  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  const endTime = performance.now();
  const startTime = response.config?.metadata?.startTime || endTime;
  const durationSeconds = (endTime - startTime) / 1000;

  const urlPath = response.config.url || 'unknown';
  const isAIRequest = urlPath.includes('chat') || urlPath.includes('ai') || urlPath.includes('tutor');
  const contextLabel = isAIRequest ? 'ai_tutor_session' : 'general_api';

  if (isAIRequest) {
    if (global.prometheusRegistry || typeof window !== 'undefined') {
      const BACKEND_METRICS_API = '/api/frontend-metrics';
      const data = JSON.stringify({
        name: 'brainbytes_frontend_ai_response_latency_seconds',
        type: 'histogram',
        value: durationSeconds,
        labels: { subject: 'ai_tutor', status: 'success' }
      });
      if (navigator.sendBeacon) navigator.sendBeacon(BACKEND_METRICS_API, data);
    }
  }

  if (response.data) {
    const responseString = typeof response.data === 'object' ? JSON.stringify(response.data) : String(response.data);
    const bytesReceived = new Blob([responseString]).size;
    
    BrainBytesMonitor.trackDataUsage(bytesReceived, `inbound_${contextLabel}`);
  }

  return response;
}, (error) => {
  const endTime = performance.now();
  const startTime = error.config?.metadata?.startTime || endTime;
  const durationSeconds = (endTime - startTime) / 1000;
  const urlPath = error.config?.url || 'unknown';
  const isAIRequest = urlPath.includes('chat') || urlPath.includes('ai') || urlPath.includes('tutor');

  if (isAIRequest && typeof window !== 'undefined') {
    const data = JSON.stringify({
      name: 'brainbytes_frontend_ai_response_latency_seconds',
      type: 'histogram',
      value: durationSeconds,
      labels: { subject: 'ai_tutor', status: 'error' }
    });
    if (navigator.sendBeacon) navigator.sendBeacon('/api/frontend-metrics', data);
  }

  return Promise.reject(error);
});
