import React from 'react';
import styles from '../styles/ChatInterface.module.css';

export const ControlBar = ({ 
  timeRange, 
  setTimeRange, 
  selectedModel, 
  setSelectedModel, 
  showAnnotations, 
  setShowAnnotations 
}) => {
  return (
    <div className={styles.controlBar}>
      <div className={styles.filterGroup}>
        {/* Time Selector Dropdown */}
        <select 
          value={timeRange} 
          onChange={(e) => setTimeRange(e.target.value)} 
          className={styles.dropdownSelect}
        >
          <option value="15m">Last 15 Minutes</option>
          <option value="1h">Last 1 Hour</option>
          <option value="24h">Last 24 Hours</option>
        </select>

        {/* AI Model Dropdown */}
        <select 
          value={selectedModel} 
          onChange={(e) => setSelectedModel(e.target.value)} 
          className={styles.dropdownSelect}
        >
          <option value="all">All Models</option>
          <option value="gpt4">GPT-4 Core</option>
          <option value="claude3">Claude 3 Core</option>
        </select>
      </div>

      {/* Toggle Button for Recharts Annotations */}
      <button 
        onClick={() => setShowAnnotations(!showAnnotations)}
        className={styles.dropdownSelect}
        style={{ 
          backgroundColor: showAnnotations ? '#b45309' : '#334155',
          borderColor: showAnnotations ? '#d97706' : '#475569'
        }}
      >
        {showAnnotations ? "Hide Annotations" : "Show Annotations"}
      </button>
    </div>
  );
};
