import { useState, useEffect, useCallback } from 'react';
import type { HealthStatus, Page } from '../types';
import { checkHealth, getSettings, apiFetch } from '../services/api';
import ApiStatusCard from './ApiStatusCard';

export default function Dashboard({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [statuses, setStatuses] = useState<HealthStatus[]>([]);
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');
  const [stats, setStats] = useState<{ label: string; value: string; icon: string }[]>([
    { label: 'Users', value: '—', icon: '👥' },
    { label: 'Servers', value: '—', icon: '🖥️' },
    { label: 'Groups', value: '—', icon: '📁' },
    { label: 'Sessions', value: '—', icon: '🔗' },
    { label: 'Pending', value: '—', icon: '⏳' },
  ]);
  const settings = getSettings();

  const apis = [
    { name: 'Fudo PAM', url: settings.fudoUrl },
    { name: 'Matrix42 ESM', url: settings.matrixUrl },
    { name: 'Active Directory', url: settings.adUrl },
    { name: 'Microsoft Entra ID', url: settings.azureAdUrl },
    { name: 'ServiceNow ITSM', url: settings.snowUrl },
    { name: 'Jira Service Mgmt', url: settings.jsmUrl },
    { name: 'BMC Remedy/Helix', url: settings.remedyUrl },
  ];

  const pollHealth = useCallback(async () => {
    const results = await Promise.all(
      apis.map(async (api) => {
        const h = await checkHealth(api.url);
        return { name: api.name, url: api.url, ...h };
      })
    );
    setStatuses(results);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStats = useCallback(async () => {
    const base = settings.fudoUrl;
    const fetches = [
      { label: 'Users', icon: '👥', url: `${base}/api/v2/users` },
      { label: 'Servers', icon: '🖥️', url: `${base}/api/v2/servers` },
      { label: 'Groups', icon: '📁', url: `${base}/api/v2/groups` },
      { label: 'Sessions', icon: '🔗', url: `${base}/api/v2/sessions` },
      { label: 'Pending', icon: '⏳', url: `${base}/api/v2/access-requests?status=pending` },
    ];
    const results = await Promise.all(
      fetches.map(async (f) => {
        try {
          const res = await fetch(f.url);
          if (!res.ok) return { ...f, value: '—' };
          const data = await res.json();
          const count = data.total ?? data.length ?? (Array.isArray(data) ? data.length : '—');
          return { ...f, value: String(count) };
        } catch {
          return { ...f, value: '—' };
        }
      })
    );
    setStats(results.map(r => ({ label: r.label, value: r.value, icon: r.icon })));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    pollHealth();
    fetchStats();
    const i = setInterval(pollHealth, 10000);
    return () => clearInterval(i);
  }, [pollHealth, fetchStats]);

  const quickActions = [
    { icon: '▶️', title: 'Run Onboarding Demo', desc: 'Test the full onboarding flow', template: 0, color: 'from-blue-600/20 to-blue-700/10 border-blue-600/30 hover:border-blue-500' },
    { icon: '🚨', title: 'Emergency Revoke Demo', desc: 'Block a compromised account in seconds', template: 3, color: 'from-red-600/20 to-red-700/10 border-red-600/30 hover:border-red-500' },
    { icon: '🔧', title: 'Custom Workflow', desc: 'Start from scratch or pick a template', template: -1, color: 'from-purple-600/20 to-purple-700/10 border-purple-600/30 hover:border-purple-500' },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
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

      {/* Quick Actions */}
      <h3 className="text-lg font-semibold text-gray-200 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-4">
        {quickActions.map((qa) => (
          <button
            key={qa.title}
            onClick={() => onNavigate('workflow')}
            className={`text-left p-5 rounded-xl border bg-gradient-to-br ${qa.color} transition-colors`}
          >
            <div className="text-2xl mb-2">{qa.icon}</div>
            <div className="text-base font-semibold text-gray-100">{qa.title}</div>
            <div className="text-sm text-gray-400 mt-1">{qa.desc}</div>
          </button>
        ))}
      </div>

      {/* Reset Mock Data */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={async () => {
            setResetting(true);
            setResetMsg('');
            const resetUrls = [
              '/api/fudo/reset', '/api/matrix42/reset', '/api/ad/reset',
              '/api/azure-ad/reset',
              '/api/snow/reset', '/api/jsm/reset', '/api/remedy/reset',
            ];
            const resetResults = await Promise.allSettled(
              resetUrls.map(url => apiFetch(url, 'POST'))
            );
            const ok = resetResults.filter(r => r.status === 'fulfilled' && (r.value as { status: number }).status === 200).length;
            setResetMsg(`Reset ${ok}/${resetUrls.length} services`);
            setResetting(false);
            setTimeout(() => setResetMsg(''), 3000);
          }}
          disabled={resetting}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {resetting ? '⏳ Resetting...' : '🔄 Reset Mock Data'}
        </button>
        {resetMsg && <span className="text-sm text-green-400">{resetMsg}</span>}
      </div>
    </div>
  );
}
