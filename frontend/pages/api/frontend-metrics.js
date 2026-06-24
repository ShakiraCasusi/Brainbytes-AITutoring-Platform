import client from 'prom-client';

const registry = global.prometheusRegistry || new client.Registry();
if (!global.prometheusRegistry) {
  global.prometheusRegistry = registry;
  client.collectDefaultMetrics({ register: registry }); 
}


const sessionDurationGauge = registry.getSingleMetric('brainbytes_frontend_session_duration_seconds') || 
  new client.Gauge({
    name: 'brainbytes_frontend_session_duration_seconds',
    help: 'Total session duration of the student in seconds',
    labelNames: ['app_version'],
    registers: [registry]
  });


const uiLatencyHistogram = registry.getSingleMetric('brainbytes_frontend_ui_latency_seconds') ||
  new client.Histogram({
    name: 'brainbytes_frontend_ui_latency_seconds',
    help: 'Delay between user action and visual render updates',
    labelNames: ['page', 'interaction_type'],
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5], 
  });


  const aiLatencyHistogram = registry.getSingleMetric('brainbytes_frontend_ai_response_latency_seconds') ||
  new client.Histogram({
    name: 'brainbytes_frontend_ai_response_latency_seconds',
    help: 'Duration of AI tutor response generations from user perspective',
    labelNames: ['subject', 'status'],
    buckets: [0.5, 1, 2, 5, 10, 20], 
    registers: [registry]
  });

const networkOfflineCounter = registry.getSingleMetric('brainbytes_frontend_ph_network_offline_events_total') ||
  new client.Counter({
    name: 'brainbytes_frontend_ph_network_offline_events_total',
    help: 'Count of times internet connection dropped for PH mobile users',
    labelNames: ['connection_type'],
    registers: [registry]
  });

const networkOnlineCounter = registry.getSingleMetric('brainbytes_frontend_ph_network_online_events_total') ||
  new client.Counter({
    name: 'brainbytes_frontend_ph_network_online_events_total',
    help: 'Count of times connection recovered',
    labelNames: ['connection_type'],
    registers: [registry]
  });


  const dataUsageCounter = registry.getSingleMetric('brainbytes_frontend_ph_data_usage_kb_total') ||
  new client.Counter({
    name: 'brainbytes_frontend_ph_data_usage_kb_total',
    help: 'Accumulated data payload consumed in Kilobytes to monitor promo limits',
    labelNames: ['resource_type', 'network_type', 'data_saver'],
    registers: [registry]
  });



  export default async function handler(req, res) {

    if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { name, value, labels } = body;

      switch (name) {
        case 'brainbytes_frontend_session_duration_seconds':
          sessionDurationGauge.set(labels, value);
          break;
        case 'brainbytes_frontend_ui_latency_seconds':
          uiLatencyHistogram.observe(labels, value);
          break;
        case 'brainbytes_frontend_ai_response_latency_seconds':
          aiLatencyHistogram.observe(labels, value);
          break;
        case 'brainbytes_frontend_ph_network_offline_events_total':
          networkOfflineCounter.inc(labels, 1);
          break;
        case 'brainbytes_frontend_ph_network_online_events_total':
          networkOnlineCounter.inc(labels, 1);
          break;
        case 'brainbytes_frontend_ph_data_usage_kb_total':
          dataUsageCounter.inc(labels, value);
          break;
      }
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(400).json({ error: 'Invalid metric formatting' });
    }
  }

  if (req.method === 'GET') {
    res.setHeader('Content-Type', registry.contentType);
    const metricsString = await registry.metrics();
    return res.status(200).send(metricsString);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
