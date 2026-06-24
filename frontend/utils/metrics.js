
const BACKEND_METRICS_API = '/api/frontend-metrics';

function sendMetricToBackend(metricPayload) {
  const data = JSON.stringify(metricPayload);
  
  if (typeof window !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(BACKEND_METRICS_API, data);
  } else if (typeof window !== 'undefined') {
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
            value: entry.duration / 1000, 
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
  },

  trackNetworkStatus() {
    if (typeof window === 'undefined') return;

    window.addEventListener('offline', () => {
      sendMetricToBackend({
        name: 'brainbytes_frontend_ph_network_offline_events_total',
        type: 'counter',
        value: 1,
        labels: { connection_type: navigator.connection?.effectiveType || 'unknown' }
      });
    });

    window.addEventListener('online', () => {
      sendMetricToBackend({
        name: 'brainbytes_frontend_ph_network_online_events_total',
        type: 'counter',
        value: 1,
        labels: { connection_type: navigator.connection?.effectiveType || 'unknown' }
      });
    });
  },

  trackDataUsage(bytesSentOrReceived, resourceType) {
    if (typeof window === 'undefined') return;

    const connectionInfo = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const isDataSaver = connectionInfo?.saveData ? 'enabled' : 'disabled';
    const netType = connectionInfo?.effectiveType || 'unknown'; 
    const kilobytes = bytesSentOrReceived / 1024;

    sendMetricToBackend({
      name: 'brainbytes_frontend_ph_data_usage_kb_total',
      type: 'counter',
      value: kilobytes,
      labels: { 
        resource_type: resourceType, 
        network_type: netType, 
        data_saver: isDataSaver 
      }
    });
  }
};
