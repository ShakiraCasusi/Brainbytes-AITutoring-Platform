import client from 'prom-client';

client.register.clear();

const sessionDurationGauge = new client.Gauge({
  name: 'brainbytes_frontend_session_duration_seconds',
  help: 'Total session duration of the student in seconds',
  labelNames: ['app_version'],
});

const uiLatencyHistogram = new client.Histogram({
  name: 'brainbytes_frontend_ui_latency_seconds',
  help: 'Delay between user action and visual render updates',
  labelNames: ['page', 'interaction_type'],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5],
});

const aiLatencyHistogram = new client.Histogram({
  name: 'brainbytes_frontend_ai_response_latency_seconds',
  help: 'Duration of AI tutor response generations from user perspective',
  labelNames: ['subject', 'status'],
  buckets: [0.5, 1, 2, 5, 10, 20],
});

const networkOfflineCounter = new client.Counter({
  name: 'brainbytes_frontend_ph_network_offline_events_total',
  help: 'Count of times internet connection dropped for PH mobile users',
  labelNames: ['connection_type'],
});

const networkOnlineCounter = new client.Counter({
  name: 'brainbytes_frontend_ph_network_online_events_total',
  help: 'Count of times connection recovered',
  labelNames: ['connection_type'],
});

const dataUsageCounter = new client.Counter({
  name: 'brainbytes_frontend_ph_data_usage_kb_total',
  help: 'Accumulated data payload consumed in Kilobytes to monitor promo limits',
  labelNames: ['resource_type', 'network_type', 'data_saver'],
});


export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { name, value, labels } = body;

      const safeLabels = labels || {};

      switch (name) {
        case 'brainbytes_frontend_session_duration_seconds':
          sessionDurationGauge.set(safeLabels, Number(value));
          break;
        case 'brainbytes_frontend_ui_latency_seconds':
          uiLatencyHistogram.observe(safeLabels, Number(value));
          break;
        case 'brainbytes_frontend_ai_response_latency_seconds':
          aiLatencyHistogram.observe(safeLabels, Number(value));
          break;
        case 'brainbytes_frontend_ph_network_offline_events_total':
          networkOfflineCounter.inc(safeLabels, 1);
          break;
        case 'brainbytes_frontend_ph_network_online_events_total':
          networkOnlineCounter.inc(safeLabels, 1);
          break;
        case 'brainbytes_frontend_ph_data_usage_kb_total':
          dataUsageCounter.inc(safeLabels, Number(value));
          break;
      }
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("Failed parsing metric payload:", err);
      return res.status(400).json({ error: 'Invalid metric formatting' });
    }
  }

  if (req.method === 'GET') {
    res.setHeader('Content-Type', client.register.contentType);
    const metricsString = await client.register.metrics();
    return res.status(200).send(metricsString);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
