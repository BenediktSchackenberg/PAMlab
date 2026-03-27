import { useState, useEffect, useCallback } from 'react';
import type { HealthStatus, Page } from '../types';
import { checkHealth, getSettings } from '../services/api';
import ApiStatusCard from './ApiStatusCard';

export default function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [statuses, setStatuses] = useState<HealthStatus[]>([]);
  const settings = getSettings();

  const apis = [
    { name: 'Fudo PAM', url: settings.fudoUrl },
    { name: 'Matrix42 ESM', url: settings.matrixUrl },
    { name: 'Active Directory', url: settings.adUrl },
    { name: 'ServiceNow ITSM', url: settings.snowUrl },
  ];

  const pollHealth = useCallback(async () => {
    const results = await Promise.all(
      apis.map(async (api) => {
        const h = await checkHealth(api.url);
        return { name: api.name, url: api.url, ...h };
      })
    );
    setStatuses(results);
  }, []);

  useEffect(() => {
    pollHealth();
    const i = setInterval(pollHealth, 10000);
    return () => clearInterval(i);
  }, [pollHealth]);

  const stats = [
    { label: 'Users', value: '—', icon: '👥' },
    { label: 'Servers', value: '—', icon: '🖥️' },
    { label: 'Groups', value: '—', icon: '📁' },
    { label: 'Sessions', value: '—', icon: '🔗' },
    { label: 'Pending', value: '—', icon: '⏳' },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Dashboard</h2>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {statuses.map((s) => (
          <ApiStatusCard key={s.name} status={s} />
        ))}
      </div>

      <div className="grid grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xl font-bold text-gray-100">{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={() => onNavigate('scenarios')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          📋 New Scenario
        </button>
        <button onClick={() => onNavigate('explorer')} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">
          🔍 API Explorer
        </button>
        <button onClick={() => onNavigate('editor')} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">
          📝 Run Script
        </button>
      </div>
    </div>
  );
}
