
import { BrainBytesMonitor } from '../utils/metrics'; 

const BACKEND_METRICS_API = '/api/frontend-metrics';

function sendMetricToBackend(metricPayload) {
  const data = JSON.stringify(metricPayload);
  
  if (navigator.sendBeacon) {
    navigator.sendBeacon(BACKEND_METRICS_API, data);
  } else {
    fetch(BACKEND_METRICS_API, {
      method: 'POST',
      body: data,
      headers: { 'Content-Type': 'application/json' },
    }).catch(err => console.error('Metrics sync failed:', err));
  }
}

export const BrainBytesMonitor = {
  sessionStartTime: null,


  initializeSession() {
    this.sessionStartTime = Date.now();
  },

  flushSessionDuration() {
    if (!this.sessionStartTime) return;
    const durationSeconds = (Date.now() - this.sessionStartTime) / 1000;
    
    sendMetricToBackend({
      name: 'brainbytes_frontend_session_duration_seconds',
      type: 'gauge',
      value: durationSeconds,
      labels: { app_version: '1.0.0' }
    });
  },


  initUserInteractionTracking(pageName) {
    try {
      const observer = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          sendMetricToBackend({
            name: 'brainbytes_frontend_ui_latency_seconds',
            type: 'histogram',
            value: entry.duration / 1000, // Convert ms to seconds
            labels: { page: pageName, interaction_type: entry.name }
          });
        }
      });

      observer.observe({ type: 'first-input', buffered: true });
    } catch (e) {
      console.warn('PerformanceObserver not fully supported in this browser.');
    }
  },

  async measureAIRequest(tutorSubject, apiCallPromise) {
    const startTime = performance.now();
    try {
      const result = await apiCallPromise();
      const finalDuration = (performance.now() - startTime) / 1000;
      
      sendMetricToBackend({
        name: 'brainbytes_frontend_ai_response_latency_seconds',
        type: 'histogram',
        value: finalDuration,
        labels: { subject: tutorSubject, status: 'success' }
      });
      return result;
    } catch (error) {
      const finalDuration = (performance.now() - startTime) / 1000;
      
      sendMetricToBackend({
        name: 'brainbytes_frontend_ai_response_latency_seconds',
        type: 'histogram',
        value: finalDuration,
        labels: { subject: tutorSubject, status: 'error' }
      });
      throw error;
    }
  }
};
