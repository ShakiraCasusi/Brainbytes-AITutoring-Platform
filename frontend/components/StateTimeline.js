import styles from '../styles/ChatInterface.module.css';
import React from 'react';

const servicesData = [
  { name: 'LLM Gateway API', states: ['online', 'online', 'degraded', 'online', 'online', 'online', 'online', 'online', 'online'] },
  { name: 'Vector DB Sync', states: ['online', 'online', 'offline', 'offline', 'online', 'online', 'online', 'online', 'online'] },
  { name: 'Student UI Assets', states: ['online', 'online', 'online', 'online', 'online', 'online', 'online', 'online', 'online'] },
];

export const StateTimeline = () => {
  const stateColorMap = {
    online: 'bg-emerald-500 hover:bg-emerald-400',
    degraded: 'bg-amber-500 hover:bg-amber-400',
    offline: 'bg-rose-500 hover:bg-rose-400',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col justify-between text-slate-100">
      <h3 className="text-slate-200 text-sm font-semibold mb-5">Service Operational Status Timeline</h3>
      <div className="space-y-4">
        {servicesData.map((service, idx) => (
          <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3 last:border-0 last:pb-0">
            <span className="text-xs font-medium text-slate-400 w-36 truncate">{service.name}</span>
            <div className="flex-1 flex gap-1 h-6">
              {service.states.map((state, cellIdx) => (
                <div 
                  key={cellIdx} 
                  className={`flex-1 rounded-sm transition-colors duration-200 cursor-pointer ${stateColorMap[state]}`}
                  title={`Status: ${state}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
