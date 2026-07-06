import React, { useState } from 'react';
import { ControlBar } from '../components/ControlBar';
import { StatPanel } from '../components/StatPanel';
import { HeatmapChart } from '../components/HeatmapChart';
import { StateTimeline } from '../components/StateTimeline';
import styles from '../styles/ChatInterface.module.css';

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState('1h');
  const [selectedModel, setSelectedModel] = useState('all');
  const [showAnnotations, setShowAnnotations] = useState(true);

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h1>AI Tutoring Telemetry Platform</h1>
      </header>

      <ControlBar 
        timeRange={timeRange} setTimeRange={setTimeRange}
        selectedModel={selectedModel} setSelectedModel={setSelectedModel}
        showAnnotations={showAnnotations} setShowAnnotations={setShowAnnotations}
      />

      {/* 🟢 PASS THE ACTIVE TIME AND MODEL STATE DOWN INTO STATS */}
      <section className={styles.statGrid}>
        <StatPanel title="API Route Latency (P95)" timeRange={timeRange} selectedModel={selectedModel} metricType="latency" status="nominal" />
        <StatPanel title="Active Error Analysis" timeRange={timeRange} selectedModel={selectedModel} metricType="errors" status="warning" />
        <StatPanel title="LLM Token Quota Left" timeRange={timeRange} selectedModel={selectedModel} metricType="tokens" status="critical" gaugeValue={12} />
        <StatPanel title="System Memory Allocated" timeRange={timeRange} selectedModel={selectedModel} metricType="memory" status="nominal" gaugeValue={74.2} />
      </section>

      {/* 🟢 PASS THE ACTIVE SELECTIONS INTO CHARTS */}
      <section className={styles.chartGrid}>
        <div className={styles.chartCard}>
          <HeatmapChart title="AI Gateway Request Latency Matrix Distribution" timeRange={timeRange} selectedModel={selectedModel} showAnnotations={showAnnotations} />
        </div>
        <div className={styles.chartCard}>
          <HeatmapChart title="Error Code Analysis Density Graph" timeRange={timeRange} selectedModel={selectedModel} showAnnotations={showAnnotations} variant="errors" />
        </div>
      </section>

      <StateTimeline timeRange={timeRange} />
    </div>
  );
}
