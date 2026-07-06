import React, { useState, useEffect } from 'react';

export default function SettingsPage({ profile, settings, onSaveSettings }) {
  const [activeTab, setActiveTab] = useState('general'); // general, health

  // Template filters state
  const [service, setService] = useState('all');
  const [endpoint, setEndpoint] = useState('all');
  const [instance, setInstance] = useState('all');
  const [timeRange, setTimeRange] = useState('1h');
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [deviceMode, setDeviceMode] = useState('desktop'); // desktop (Wi-Fi), mobile (Mobile Data)

  // Mock Alerts Feed state
  const [alerts, setAlerts] = useState([
    { id: 1, name: 'SlowMobileResponses', severity: 'warning', service: 'brainbytes-frontend', message: '95th percentile mobile client API latency exceeded 3s', time: '5m ago', active: true },
    { id: 2, name: 'HTTPErrorRateWarning', severity: 'warning', service: 'brainbytes-backend', message: '5xx errors represent >5% of response traffic', time: '12m ago', active: false },
    { id: 3, name: 'DBQuerySlowCritical', severity: 'critical', service: 'mongodb', message: '95% of MongoDB queries are slower than 500ms', time: '40m ago', active: false }
  ]);
  const [activeToast, setActiveToast] = useState(null);

  // Calculate dynamic metrics based on selected dropdown options to ensure they work dynamically
  const getMetrics = () => {
    let latencyVal = 142;
    let errorRateVal = 0.14;
    let dbDurationVal = 24;
    let dataUsageVal = deviceMode === 'mobile' ? 32.1 : 14.8;

    // Adjust values based on service
    if (service === 'brainbytes-backend') {
      latencyVal = 185;
      errorRateVal = 0.22;
    } else if (service === 'brainbytes-frontend') {
      latencyVal = 88;
      errorRateVal = 0.05;
    } else if (service === 'mongodb') {
      latencyVal = 14;
      dbDurationVal = 42;
    }

    // Adjust values based on endpoint
    if (endpoint === '/api/question') {
      latencyVal += 48;
      errorRateVal += 0.15;
    } else if (endpoint === '/api/session') {
      latencyVal += 15;
    } else if (endpoint === '/api/health') {
      latencyVal = 9;
      errorRateVal = 0;
    }

    // Adjust values based on instance
    if (instance === 'container-prod-2') {
      latencyVal *= 1.2;
      errorRateVal += 0.1;
    }

    // Adjust values based on timeRange
    if (timeRange === '24h') {
      latencyVal *= 0.95;
      errorRateVal *= 1.1;
    } else if (timeRange === '7d') {
      latencyVal *= 0.9;
      errorRateVal *= 1.35;
    }

    // Adjust bounds if mobile data view selected
    if (deviceMode === 'mobile') {
      latencyVal *= 2.3;
    }

    return {
      latency: `${Math.round(latencyVal)}ms`,
      errorRate: `${errorRateVal.toFixed(2)}%`,
      dbDuration: `${Math.round(dbDurationVal)}ms`,
      dataUsage: `${dataUsageVal.toFixed(1)} MB/h`
    };
  };

  const metrics = getMetrics();

  // Trigger simulated alert
  const triggerSimulatedAlert = () => {
    const randomAlerts = [
      { name: 'HuggingFaceTimeoutWarning', severity: 'warning', service: 'brainbytes-backend', message: 'HuggingFace AI hint queries failed > 5%', time: 'Just now' },
      { name: 'HighDataUsageAlert', severity: 'warning', service: 'brainbytes-frontend', message: 'Prepaid data usage limit exceeded 50MB/hour', time: 'Just now' },
      { name: 'ServiceDownAlert', severity: 'critical', service: 'mongodb', message: 'Database connection failed', time: 'Just now' }
    ];
    const picked = randomAlerts[Math.floor(Math.random() * randomAlerts.length)];
    const newAlert = { id: Date.now(), ...picked, active: true };

    setAlerts(prev => [newAlert, ...prev]);
    setActiveToast(newAlert);
    setTimeout(() => setActiveToast(null), 5000);
  };

  // Resolve all alerts
  const resolveAllAlerts = () => {
    setAlerts(prev => prev.map(a => ({ ...a, active: false })));
    setActiveToast({ name: 'AlertsResolved', severity: 'resolved', message: 'All fired warnings successfully resolved.', time: 'Just now' });
    setTimeout(() => setActiveToast(null), 3000);
  };

  return (
    <div className="settings-page">
      {/* Sub-Header Tab Row */}
      <div className="settings-tabs">
        <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>
          General Settings
        </button>
        <button
          className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`}
          onClick={() => setActiveTab('health')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
          Monitor Health Check
        </button>
      </div>

      {activeTab === 'general' ? (
        <div className="general-settings">
          <div className="card">
            <h3>General Customizations</h3>
            <p>Customize user interface preferences and general application settings.</p>

            <div className="form-group">
              <label>Interface Theme</label>
              <select
                value={settings?.theme || 'light'}
                onChange={(e) => onSaveSettings?.({ ...settings, theme: e.target.value })}
                className="select-field"
              >
                <option value="light">Light Theme</option>
                <option value="dark">Dark Theme</option>
              </select>
            </div>

            <div className="form-group">
              <label>Prepaid Data Saver (Philippine Mobile Optimization)</label>
              <select
                value={settings?.dataSaver || 'off'}
                onChange={(e) => onSaveSettings?.({ ...settings, dataSaver: e.target.value })}
                className="select-field"
              >
                <option value="off">Off (Default assets)</option>
                <option value="on">On (Compresses response payloads, disables avatars)</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        <div className="health-dashboard animate-fade">

          {/* Explainer Panel: Smaller fonts and aligned descriptors */}
          <div className="explainer-card">
            <div className="explainer-icon-container">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </div>
            <div className="explainer-content">
              <strong className="explainer-title">Telemetry Context: Wi-Fi vs. Mobile Data Connection</strong>
              <p className="explainer-desc">
                <strong>Wi-Fi mode</strong> tracks performance metrics for high-speed stable fixed broadband lines.
                <strong> Mobile Data mode</strong> simulates constraints typical for students using prepaid cellular network data in the Philippines (reflecting latency, packet loss, and strict caps).
              </p>
            </div>
          </div>

          {/* Dashboard Control Panel / Template Variables */}
          <div className="dashboard-controls">
            <div className="control-group">
              <label>Service ($service)</label>
              <select value={service} onChange={(e) => setService(e.target.value)} className="control-select">
                <option value="all">all services</option>
                <option value="brainbytes-backend">brainbytes-backend</option>
                <option value="brainbytes-frontend">brainbytes-frontend</option>
                <option value="mongodb">mongodb</option>
              </select>
            </div>

            <div className="control-group">
              <label>Endpoint ($endpoint)</label>
              <select value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="control-select">
                <option value="all">all endpoints</option>
                <option value="/api/question">/api/question</option>
                <option value="/api/session">/api/session</option>
                <option value="/api/health">/api/health</option>
              </select>
            </div>

            <div className="control-group">
              <label>Instance ($instance)</label>
              <select value={instance} onChange={(e) => setInstance(e.target.value)} className="control-select">
                <option value="all">all instances</option>
                <option value="container-prod-1">container-prod-1</option>
                <option value="container-prod-2">container-prod-2</option>
              </select>
            </div>

            <div className="control-group">
              <label>Time Range</label>
              <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="control-select">
                <option value="1h">Last 1 hour</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
              </select>
            </div>

            <div className="control-group">
              <label>Network Connection</label>
              <div className="toggle-buttons">
                <button className={`toggle-btn ${deviceMode === 'desktop' ? 'active' : ''}`} onClick={() => setDeviceMode('desktop')}>Wi-Fi</button>
                <button className={`toggle-btn ${deviceMode === 'mobile' ? 'active' : ''}`} onClick={() => setDeviceMode('mobile')}>Mobile Data</button>
              </div>
            </div>

            <div className="control-group checkbox-group">
              <label className="checkbox-label">
                <input type="checkbox" checked={showAnnotations} onChange={(e) => setShowAnnotations(e.target.checked)} />
                Annotations
              </label>
            </div>
          </div>

          {/* Alert Status Banners & Actions */}
          <div className="dashboard-actions-row">
            <div className="status-indicator">
              <span className="pulse-dot green"></span>
              <strong>System Status: Nominal</strong>
            </div>
            <div className="button-group">
              <button
                className="sim-btn warning"
                onClick={triggerSimulatedAlert}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                Trigger Simulated Alert
              </button>
              <button
                className="sim-btn success"
                onClick={resolveAllAlerts}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Resolve Alerts
              </button>
            </div>
          </div>

          {/* High Priority: Stat Panels - Filtered dynamically by connection type */}
          <div className="stat-panels-grid-split">
            {deviceMode === 'desktop' ? (
              <div className="grid-2-columns">
                <div className="stat-card nominal">
                  <span className="card-lbl">P95 Latency (Wi-Fi)</span>
                  <h2 className="card-val">{metrics.latency}</h2>
                  <span className="card-desc">SLA limit: 300ms on fixed lines</span>
                  <span className="status-badge green">NOMINAL</span>
                </div>

                <div className="stat-card nominal">
                  <span className="card-lbl">DB Query Duration (Wi-Fi)</span>
                  <h2 className="card-val">{metrics.dbDuration}</h2>
                  <span className="card-desc">Average MongoDB Atlas query response</span>
                  <span className="status-badge green">NOMINAL</span>
                </div>
              </div>
            ) : (
              <div className="grid-2-columns">
                <div className="stat-card nominal">
                  <span className="card-lbl">HTTP Error Rate (Mobile Data)</span>
                  <h2 className="card-val">{metrics.errorRate}</h2>
                  <span className="card-desc">Percentage of total 5xx responses</span>
                  <span className="status-badge green">NOMINAL</span>
                </div>

                <div className="stat-card warning">
                  <span className="card-lbl">Outbound Data Usage (Mobile Data)</span>
                  <h2 className="card-val">{metrics.dataUsage}</h2>
                  <span className="card-desc">Prepaid limit: 50MB/hour cap</span>
                  <span className="status-badge yellow">WARNING</span>
                </div>
              </div>
            )}
          </div>

          {/* Conditional Stats & Charts blocks based on Connection Mode */}
          {deviceMode === 'desktop' ? (
            /* 🌐 WI-FI SPECIFIC STATS AND CHARTS */
            <div className="charts-container-grid animate-fade">
              {/* Uptime Timeline Chart */}
              <div className="chart-wrapper-card">
                <h4>State Timeline: Service Uptime & Downtime</h4>
                <p className="chart-sub">Failsafe intervals monitoring container connectivity state.</p>

                <div className="timeline-container">
                  <div className="timeline-row">
                    <span className="row-lbl">brainbytes-backend</span>
                    <div className="bar-wrapper">
                      <span className="time-block up"></span>
                      <span className="time-block up"></span>
                      <span className="time-block up"></span>
                      <span className="time-block down"></span>
                      <span className="time-block up"></span>
                      <span className="time-block up"></span>
                    </div>
                    <span className="uptime-percentage">98.4%</span>
                  </div>

                  <div className="timeline-row">
                    <span className="row-lbl">brainbytes-frontend</span>
                    <div className="bar-wrapper">
                      <span className="time-block up"></span>
                      <span className="time-block up"></span>
                      <span className="time-block up"></span>
                      <span className="time-block up"></span>
                      <span className="time-block up"></span>
                      <span className="time-block up"></span>
                    </div>
                    <span className="uptime-percentage">100%</span>
                  </div>

                  <div className="timeline-row">
                    <span className="row-lbl">mongodb</span>
                    <div className="bar-wrapper">
                      <span className="time-block up"></span>
                      <span className="time-block up"></span>
                      <span className="time-block up"></span>
                      <span className="time-block up"></span>
                      <span className="time-block up"></span>
                      <span className="time-block up"></span>
                    </div>
                    <span className="uptime-percentage">100%</span>
                  </div>
                </div>

                {showAnnotations && (
                  <div className="annotations-line">
                    <span className="annotation-marker" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      Deployment v1.2.1 (12h ago)
                    </span>
                  </div>
                )}
              </div>

              {/* Frontend Performance telemetry */}
              <div className="chart-wrapper-card">
                <h4>Frontend Monitoring & Core Web Vitals</h4>
                <p className="chart-sub">FCP, LCP, and component render speeds in Wi-Fi view.</p>
                <div className="frontend-telemetry-grid">
                  <div className="vitals-card">
                    <h5>First Contentful Paint</h5>
                    <h3>1.2s</h3>
                    <span className="badge green">GOOD</span>
                  </div>
                  <div className="vitals-card">
                    <h5>Largest Contentful Paint</h5>
                    <h3>2.1s</h3>
                    <span className="badge green">GOOD</span>
                  </div>
                  <div className="vitals-card">
                    <h5>Component Render Performance</h5>
                    <ul className="performance-list">
                      <li><code>ChatPanel</code>: 12ms</li>
                      <li><code>Dashboard</code>: 8ms</li>
                      <li><code>LearningWorkspace</code>: 15ms</li>
                    </ul>
                  </div>
                  <div className="vitals-card">
                    <h5>API error rates (Next.js client)</h5>
                    <h3>0.00%</h3>
                    <span className="badge green">GOOD</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* 📱 MOBILE DATA SPECIFIC STATS AND CHARTS */
            <div className="mobile-stats-wrapper animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* Gauges & Telemetry */}
              <div className="charts-container-grid">
                <div className="chart-wrapper-card">
                  <h4>Resource Usage vs. Threshold Limits</h4>
                  <p className="chart-sub">Checks container allocations against free tier restrictions.</p>

                  <div className="gauge-row">
                    <span className="gauge-lbl">Backend Memory (Limit: 512MB)</span>
                    <div className="gauge-bar-outer">
                      <div className="gauge-bar-inner ok" style={{ width: '64%' }}></div>
                    </div>
                    <span className="gauge-val">327MB (64%)</span>
                  </div>

                  <div className="gauge-row">
                    <span className="gauge-lbl">Frontend Memory (Limit: 512MB)</span>
                    <div className="gauge-bar-outer">
                      <div className="gauge-bar-inner ok" style={{ width: '42%' }}></div>
                    </div>
                    <span className="gauge-val">215MB (42%)</span>
                  </div>

                  <div className="gauge-row">
                    <span className="gauge-lbl">Database Memory (Limit: 512MB)</span>
                    <div className="gauge-bar-outer">
                      <div className="gauge-bar-inner warning" style={{ width: '87%' }}></div>
                    </div>
                    <span className="gauge-val">445MB (87%)</span>
                  </div>
                </div>

                <div className="chart-wrapper-card">
                  <h4>Container-Level Real-Time Telemetry</h4>
                  <p className="chart-sub">CPU, memory allocations and network traffic sizes.</p>
                  <table className="telemetry-table">
                    <thead>
                      <tr>
                        <th>Container</th>
                        <th>CPU Used</th>
                        <th>Memory</th>
                        <th>Network I/O</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>brainbytes-backend</td>
                        <td>14.2%</td>
                        <td>327 MB</td>
                        <td>1.2 MB / 8.4 MB</td>
                      </tr>
                      <tr>
                        <td>brainbytes-frontend</td>
                        <td>4.8%</td>
                        <td>215 MB</td>
                        <td>5.4 MB / 12.1 MB</td>
                      </tr>
                      <tr>
                        <td>mongodb</td>
                        <td>8.1%</td>
                        <td>445 MB</td>
                        <td>804 KB / 2.3 MB</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Heatmap & Alerts Feed Panel */}
              <div className="charts-container-grid">
                <div className="chart-wrapper-card">
                  <h4>Heatmap: Error Distribution by Endpoint & Time-of-Day</h4>
                  <p className="chart-sub">Density highlights higher occurrences of error responses.</p>

                  <div className="heatmap-grid">
                    <div className="heatmap-row">
                      <span className="row-lbl">/api/question</span>
                      <span className="heat-cell cell-0"></span>
                      <span className="heat-cell cell-1"></span>
                      <span className="heat-cell cell-0"></span>
                      <span className="heat-cell cell-2"></span>
                      <span className="heat-cell cell-0"></span>
                      <span className="heat-cell cell-3"></span>
                    </div>
                    <div className="heatmap-row">
                      <span className="row-lbl">/api/session</span>
                      <span className="heat-cell cell-0"></span>
                      <span className="heat-cell cell-0"></span>
                      <span className="heat-cell cell-0"></span>
                      <span className="heat-cell cell-0"></span>
                      <span className="heat-cell cell-1"></span>
                      <span className="heat-cell cell-0"></span>
                    </div>
                    <div className="heatmap-row">
                      <span className="row-lbl">/api/health</span>
                      <span className="heat-cell cell-0"></span>
                      <span className="heat-cell cell-0"></span>
                      <span className="heat-cell cell-0"></span>
                      <span className="heat-cell cell-0"></span>
                      <span className="heat-cell cell-0"></span>
                      <span className="heat-cell cell-0"></span>
                    </div>
                  </div>
                  <div className="heatmap-legend">
                    <span>00:00</span>
                    <span>04:00</span>
                    <span>08:00</span>
                    <span>12:00</span>
                    <span>16:00</span>
                    <span>20:00</span>
                  </div>
                </div>

                <div className="chart-wrapper-card">
                  <h4>Alert Feed Panel (Recent Triggered Alerts)</h4>
                  <p className="chart-sub">Recent alarms and warning details triggered under Mobile conditions.</p>
                  <div className="alert-list-panel">
                    {alerts.map(a => (
                      <div key={a.id} className={`alert-feed-item ${a.severity} ${a.active ? 'active' : 'resolved'}`}>
                        <div className="alert-top">
                          <span className="alert-name" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                              <line x1="12" y1="9" x2="12" y2="13" />
                              <line x1="12" y1="17" x2="12.01" y2="17" />
                            </svg>
                            {a.name}
                          </span>
                          <span className={`badge-pill ${a.active ? a.severity : 'resolved'}`}>
                            {a.active ? a.severity.toUpperCase() : 'RESOLVED'}
                          </span>
                        </div>
                        <p className="alert-desc">{a.message}</p>
                        <div className="alert-footer">
                          <span>Service: {a.service}</span>
                          <span>{a.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Optional Low Priority Add-ons Info */}
          <div className="optional-addons-row">
            <div className="addon-card">
              <h5 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                  <line x1="6" y1="6" x2="6.01" y2="6" />
                  <line x1="6" y1="18" x2="6.01" y2="18" />
                </svg>
                Dashboard Automation
              </h5>
              <p>Grafana dashboards are auto-provisioned from configuration JSON files at startup.</p>
            </div>
            <div className="addon-card">
              <h5 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
                Recording Rules
              </h5>
              <p>Precomputed aggregates are caching query parameters for maximum UI render speeds.</p>
            </div>
            <div className="addon-card">
              <h5 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <polygon points="6 2 18 2 18 6 6 6" />
                  <rect x="3" y="6" width="18" height="16" rx="2" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
                Custom Plugins
              </h5>
              <p>Specialized timeline plugins render client connection health statuses.</p>
            </div>
          </div>

        </div>
      )}

      {/* Simulated Toast Alerts */}
      {activeToast && (
        <div className={`simulated-toast ${activeToast.severity}`}>
          <div className="toast-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {activeToast.severity === 'resolved' ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
          </div>
          <div className="toast-content">
            <strong>{activeToast.name === 'AlertsResolved' ? 'Alerts Resolved' : `${activeToast.name} Triggered!`}</strong>
            <p>{activeToast.message}</p>
          </div>
          <style jsx="true">{`
            .simulated-toast {
              position: fixed;
              top: 24px;
              right: 24px;
              background: #191B23;
              color: #E1E2ED;
              padding: 16px 20px;
              border-radius: 8px;
              display: flex;
              gap: 12px;
              box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
              z-index: 999999;
              animation: slideInToast 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              border-left: 4px solid #F97316;
            }
            .simulated-toast.critical {
              border-left-color: #EF4444;
            }
            .simulated-toast.resolved {
              border-left-color: #22C55E;
            }
            .toast-content p {
              margin: 4px 0 0;
              font-size: 12px;
              opacity: 0.8;
            }
            @keyframes slideInToast {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      <style jsx="true">{`
        .settings-page {
          display: flex;
          flex-direction: column;
          gap: 20px;
          font-family: 'Public Sans', sans-serif;
          max-width: 1024px;
          margin: 0 auto;
        }
        .settings-page select,
        .settings-page input,
        .settings-page button,
        .settings-page table,
        .settings-page td,
        .settings-page th {
          font-family: 'Public Sans', sans-serif;
        }
        .settings-page h3,
        .settings-page h4,
        .settings-page h5,
        .tab-btn,
        .toggle-btn,
        .sim-btn {
          font-family: 'Lexend', sans-serif;
        }
        .settings-tabs {
          display: flex;
          gap: 12px;
          border-bottom: 2px solid var(--border-light);
          padding-bottom: 12px;
        }
        .tab-btn {
          background: transparent;
          border: none;
          padding: 8px 16px;
          font-family: 'Lexend', sans-serif;
          font-weight: 700;
          font-size: 16px;
          color: var(--text-secondary);
          cursor: pointer;
          border-radius: 6px;
          transition: background-color 0.2s, color 0.2s;
        }
        .tab-btn.active {
          background-color: var(--accent-orange);
          color: white;
        }
        .tab-btn:hover:not(.active) {
          background-color: rgba(67, 70, 85, 0.08);
        }
        .card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 24px;
        }
        .form-group {
          margin-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          font-weight: 700;
          font-size: 14px;
          color: var(--text-primary);
        }
        .select-field {
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 10px;
          color: var(--text-primary);
        }

        /* Explainer Panel with smaller sizes */
        .explainer-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-left: 4px solid var(--accent-blue);
          border-radius: 8px;
          padding: 10px 16px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .explainer-icon-container {
          color: var(--accent-blue);
          flex-shrink: 0;
          margin-top: 2px;
        }
        .explainer-title {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .explainer-desc {
          margin: 0;
          font-size: 10px;
          line-height: 1.5;
          color: var(--text-muted);
        }

        /* Health Dashboard Styles */
        .health-dashboard {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .dashboard-controls {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          align-items: flex-end;
        }
        .control-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .control-group label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-light);
        }
        .control-select {
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          padding: 8px 12px;
          color: var(--text-primary);
          font-size: 13px;
        }
        .toggle-buttons {
          display: flex;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          overflow: hidden;
        }
        .toggle-btn {
          background: var(--bg-card);
          border: none;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
        }
        .toggle-btn.active {
          background: var(--accent-orange);
          color: white;
        }
        .checkbox-group {
          justify-content: center;
          height: 38px;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          cursor: pointer;
        }

        .dashboard-actions-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--bg-card);
          padding: 12px 20px;
          border-radius: 8px;
          border: 1px solid var(--border-color);
        }
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pulse-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }
        .pulse-dot.green {
          background: #22C55E;
          box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7);
          animation: pulseGreen 2s infinite;
        }
        @keyframes pulseGreen {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
        }
        .button-group {
          display: flex;
          gap: 8px;
        }
        .sim-btn {
          border: none;
          border-radius: 6px;
          padding: 8px 14px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
        }
        .sim-btn.warning {
          background: rgba(249, 115, 22, 0.1);
          color: var(--accent-orange);
          border: 1px solid var(--accent-orange);
        }
        .sim-btn.success {
          background: rgba(34, 197, 94, 0.1);
          color: #22C55E;
          border: 1px solid #22C55E;
        }

        .stat-panels-grid-split {
          width: 100%;
        }
        .grid-2-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          padding: 16px;
          border-radius: 12px;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat-card.warning {
          border-left: 4px solid var(--accent-orange);
        }
        .card-lbl {
          font-size: 12px;
          color: var(--text-light);
          font-weight: 600;
        }
        .card-val {
          font-family: 'Lexend', sans-serif;
          font-weight: 700;
          font-size: 24px;
          margin: 0;
          color: var(--text-primary);
        }
        .card-desc {
          font-size: 11px;
          color: var(--text-muted);
        }
        .status-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .status-badge.green {
          background: #E8F5E9;
          color: #2E7D32;
        }
        .status-badge.yellow {
          background: #FFF3E0;
          color: #E65100;
        }

        .charts-container-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .chart-wrapper-card {
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
        }
        .chart-wrapper-card h4 {
          margin: 0 0 4px;
          font-family: 'Lexend', sans-serif;
        }
        .chart-sub {
          font-size: 12px;
          color: var(--text-muted);
          margin: 0 0 16px;
        }

        /* Heatmap Grid */
        .heatmap-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .heatmap-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .row-lbl {
          font-size: 12px;
          font-weight: 600;
          width: 100px;
          color: var(--text-secondary);
        }
        .heat-cell {
          width: 32px;
          height: 32px;
          border-radius: 4px;
        }
        .cell-0 { background: var(--bg-input); }
        .cell-1 { background: #FFE0B2; }
        .cell-2 { background: #FFB74D; }
        .cell-3 { background: #E65100; }
        .heatmap-legend {
          display: flex;
          justify-content: space-between;
          padding-left: 108px;
          font-size: 11px;
          color: var(--text-light);
          margin-top: 8px;
        }

        /* Timeline Uptime */
        .timeline-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .timeline-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .timeline-row .row-lbl {
          width: 140px;
        }
        .bar-wrapper {
          display: flex;
          gap: 4px;
          flex-grow: 1;
        }
        .time-block {
          height: 18px;
          flex-grow: 1;
          border-radius: 2px;
        }
        .time-block.up { background: #4CAF50; }
        .time-block.down { background: #F44336; }
        .uptime-percentage {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
        }
        .annotations-line {
          margin-top: 16px;
          padding-top: 8px;
          border-top: 1px dashed var(--border-color);
        }
        .annotation-marker {
          font-size: 11px;
          color: var(--accent-orange);
          font-weight: 600;
        }

        /* Gauge Rows */
        .gauge-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 12px;
        }
        .gauge-lbl {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .gauge-bar-outer {
          height: 8px;
          background: var(--bg-input);
          border-radius: 999px;
          overflow: hidden;
        }
        .gauge-bar-inner {
          height: 100%;
          border-radius: 999px;
        }
        .gauge-bar-inner.ok { background: #4CAF50; }
        .gauge-bar-inner.warning { background: var(--accent-orange); }
        .gauge-val {
          font-size: 11px;
          text-align: right;
          color: var(--text-light);
        }

        /* Telemetry Table */
        .telemetry-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .telemetry-table th, .telemetry-table td {
          padding: 10px;
          text-align: left;
          border-bottom: 1px solid var(--border-light);
        }
        .telemetry-table th {
          color: var(--text-light);
          font-weight: 700;
        }
        .telemetry-table td {
          color: var(--text-primary);
        }

        /* Frontend Telemetry Vitals */
        .frontend-telemetry-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .vitals-card {
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
        }
        .vitals-card h5 {
          margin: 0;
          font-size: 11px;
          color: var(--text-light);
        }
        .vitals-card h3 {
          margin: 0;
          font-family: 'Lexend', sans-serif;
          font-size: 18px;
          color: var(--text-primary);
        }
        .vitals-card .badge {
          position: absolute;
          top: 12px;
          right: 12px;
          font-size: 9px;
          font-weight: 700;
          color: #2E7D32;
        }
        .performance-list {
          padding-left: 14px;
          margin: 4px 0 0;
          font-size: 11px;
        }
        .performance-list li {
          margin-bottom: 2px;
        }

        /* Alert Feed Panel */
        .alert-list-panel {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 180px;
          overflow-y: auto;
        }
        .alert-feed-item {
          padding: 10px 12px;
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          border: 1px solid var(--border-color);
        }
        .alert-feed-item.active.warning {
          background: rgba(249, 115, 22, 0.05);
          border-left: 4px solid var(--accent-orange);
        }
        .alert-feed-item.active.critical {
          background: rgba(239, 68, 68, 0.05);
          border-left: 4px solid #EF4444;
        }
        .alert-feed-item.resolved {
          opacity: 0.65;
        }
        .alert-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .alert-name {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .badge-pill {
          font-size: 8px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 999px;
          color: white;
        }
        .badge-pill.warning { background: var(--accent-orange); }
        .badge-pill.critical { background: #EF4444; }
        .badge-pill.resolved { background: #22C55E; }
        .alert-desc {
          margin: 0;
          font-size: 11px;
          color: var(--text-secondary);
        }
        .alert-footer {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: var(--text-light);
        }

        .optional-addons-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        .addon-card {
          background: var(--bg-input);
          border: 1px dashed var(--border-color);
          border-radius: 8px;
          padding: 12px;
        }
        .addon-card h5 {
          margin: 0 0 4px;
          color: var(--text-primary);
        }
        .addon-card p {
          margin: 0;
          font-size: 11px;
          color: var(--text-muted);
        }

        .animate-fade {
          animation: fadeInEffect 0.3s ease-out forwards;
        }
        @keyframes fadeInEffect {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .grid-2-columns {
            grid-template-columns: 1fr;
          }
          .charts-container-grid {
            grid-template-columns: 1fr;
          }
          .optional-addons-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
