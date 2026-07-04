import React from 'react';
import { ResponsiveContainer, ComposedChart, XAxis, YAxis, Tooltip, Bar, ReferenceLine } from 'recharts';

const baseData = {
  all: [
    { time: '10:00', '0-200ms': 80, '201-500ms': 15, '>1s (Critical)': 5 },
    { time: '10:05', '0-200ms': 85, '201-500ms': 12, '>1s (Critical)': 3 },
    { time: '10:10', '0-200ms': 40, '201-500ms': 35, '>1s (Critical)': 25 },
    { time: '10:15', '0-200ms': 75, '201-500ms': 20, '>1s (Critical)': 5 }
  ],
  gpt4: [
    { time: '10:00', '0-200ms': 95, '201-500ms': 4, '>1s (Critical)': 1 },
    { time: '10:05', '0-200ms': 98, '201-500ms': 2, '>1s (Critical)': 0 },
    { time: '10:10', '0-200ms': 92, '201-500ms': 6, '>1s (Critical)': 2 },
    { time: '10:15', '0-200ms': 96, '201-500ms': 3, '>1s (Critical)': 1 }
  ],
  claude3: [
    { time: '10:00', '0-200ms': 60, '201-500ms': 30, '>1s (Critical)': 10 },
    { time: '10:05', '0-200ms': 55, '201-500ms': 32, '>1s (Critical)': 13 },
    { time: '10:10', '0-200ms': 15, '201-500ms': 45, '>1s (Critical)': 40 }, // High delay peak block
    { time: '10:15', '0-200ms': 50, '201-500ms': 35, '>1s (Critical)': 15 }
  ]
};

export const HeatmapChart = ({ title, selectedModel, showAnnotations }) => {
  const chartData = baseData[selectedModel] || baseData.all;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h3 style={{ color: '#e2e8f0', fontSize: '14px', margin: '0 0 16px 0' }}>{title}</h3>
      <div style={{ flex: 1, minHeight: 0, marginLeft: '-25px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData}>
            <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} />
            <Bar dataKey="0-200ms" stackId="latency" fill="#10b981" fillOpacity={0.8} />
            <Bar dataKey="201-500ms" stackId="latency" fill="#f59e0b" fillOpacity={0.8} />
            <Bar dataKey="&gt;1s (Critical)" stackId="latency" fill="#ef4444" fillOpacity={0.8} />
            
            {showAnnotations && selectedModel === 'all' && (
              <ReferenceLine x="10:10" stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'v1.2 Outage', fill: '#facc15', fontSize: 10, position: 'top' }} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
