import React from 'react';
import styles from '../styles/ChatInterface.module.css';

// Context mapping dictionary simulating dynamic server data
const metricsDatabase = {
  all: { latency: '240ms', errors: '14 Exceptions', tokens: 12, memory: 74.2 },
  gpt4: { latency: '190ms', errors: '3 Exceptions', tokens: 45, memory: 42.1 },
  claude3: { latency: '310ms', errors: '11 Exceptions', tokens: 8, memory: 32.1 }
};

export const StatPanel = ({ title, status, gaugeValue, timeRange, selectedModel, metricType }) => {
  const cardStyle = `${styles.statCard} ${styles[status + 'Card']}`;
  const textStyle = styles[status + 'Text'];

  // Dynamically resolve metrics based on user selection state
  const currentModelData = metricsDatabase[selectedModel] || metricsDatabase.all;
  let displayValue = currentModelData[metricType];
  
  // Calculate relative variance offsets if user adjusts the global timeline dropdown
  let finalGaugeValue = gaugeValue;
  if (metricType === 'tokens' || metricType === 'memory') {
    finalGaugeValue = timeRange === '15m' ? Math.floor(currentModelData[metricType] * 0.8) : currentModelData[metricType];
    displayValue = `${finalGaugeValue}%`;
  }

  return (
    <div className={cardStyle}>
      <div>
        <h3 style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 8px 0' }}>{title}</h3>
        <div>
          <span style={{ fontSize: '32px', fontWeight: 'bold' }} className={textStyle}>{displayValue}</span>
        </div>
      </div>

      {gaugeValue !== undefined && (
        <div className={styles.gaugeContainer}>
          <div style={{ display: 'flex', justifyBetween: 'space-between', fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>
            <span>Capacity Utilization</span>
          </div>
          <div className={styles.gaugeTrack}>
            <div 
              className={styles.gaugeBar} 
              style={{ 
                width: `${finalGaugeValue}%`,
                backgroundColor: status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981'
              }} 
            />
          </div>
        </div>
      )}
    </div>
  );
};
