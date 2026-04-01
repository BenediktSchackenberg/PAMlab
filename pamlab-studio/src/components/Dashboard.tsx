import { useState, useEffect, useCallback } from 'react';
import type { HealthStatus, Page } from '../types';
import { checkHealth, getSettings, apiFetch } from '../services/api';
import ApiStatusCard from './ApiStatusCard';

type StatsResponse = {
  total?: number;
  items?: unknown[];
  users?: unknown[];
  data?: unknown[];
};

function extractCount(data: unknown): string {
  if (Array.isArray(data)) return String(data.length);
  if (!data || typeof data !== 'object') return '—';

  const typed = data as StatsResponse;
  if (typeof typed.total === 'number') return String(typed.total);
  if (Array.isArray(typed.items)) return String(typed.items.length);
  if (Array.isArray(typed.users)) return String(typed.users.length);
  if (Array.isArray(typed.data)) return String(typed.data.length);

  return '—';
}

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

  const pollHealth = useCallback(async () => {
    const apis = [
      { name: 'Fudo PAM', url: settings.fudoUrl },
      { name: 'Matrix42 ESM', url: settings.matrixUrl },
      { name: 'Active Directory', url: settings.adUrl },
      { name: 'ServiceNow ITSM', url: settings.snowUrl },
      { name: 'Jira Service Mgmt', url: settings.jsmUrl },
      { name: 'BMC Remedy/Helix', url: settings.remedyUrl },
      { name: 'CyberArk PVWA', url: settings.cyberarkUrl },
    ];
    const results = await Promise.all(
      apis.map(async (api) => {
        const health = await checkHealth(api.url);
        return { name: api.name, url: api.url, ...health };
      }),
    );
    setStatuses(results);
  }, [
    settings.adUrl,
    settings.cyberarkUrl,
    settings.fudoUrl,
    settings.jsmUrl,
    settings.matrixUrl,
    settings.remedyUrl,
    settings.snowUrl,
  ]);

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
      fetches.map(async (entry) => {
        const res = await apiFetch(entry.url, 'GET');
        if (res.status < 200 || res.status >= 400) {
          return { ...entry, value: '—' };
        }
        return { ...entry, value: extractCount(res.data) };
      }),
    );

    setStats(results.map((result) => ({ label: result.label, value: result.value, icon: result.icon })));
  }, [settings.fudoUrl]);

  useEffect(() => {
    const loadDashboard = async () => {
      await Promise.all([pollHealth(), fetchStats()]);
    };

    void loadDashboard();
    const interval = setInterval(() => {
      void pollHealth();
    }, 10000);
    return () => clearInterval(interval);
  }, [pollHealth, fetchStats]);

  const quickActions = [
    {
      icon: '▶️',
      title: 'Run Onboarding Demo',
      desc: 'Test the full onboarding flow',
      template: 0,
      color: 'from-blue-600/20 to-blue-700/10 border-blue-600/30 hover:border-blue-500',
    },
    {
      icon: '🚨',
      title: 'Emergency Revoke Demo',
      desc: 'Block a compromised account in seconds',
      template: 3,
      color: 'from-red-600/20 to-red-700/10 border-red-600/30 hover:border-red-500',
    },
    {
      icon: '🔧',
      title: 'Custom Workflow',
      desc: 'Start from scratch or pick a template',
      template: -1,
      color: 'from-purple-600/20 to-purple-700/10 border-purple-600/30 hover:border-purple-500',
    },
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Dashboard</h2>

      <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 xl:grid-cols-7">
        {statuses.map((status) => (
          <ApiStatusCard key={status.name} status={status} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700 text-center">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-xl font-bold text-gray-100">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <h3 className="text-lg font-semibold text-gray-200 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {quickActions.map((quickAction) => (
          <button
            key={quickAction.title}
            onClick={() => onNavigate('workflow')}
            className={`text-left p-5 rounded-xl border bg-gradient-to-br ${quickAction.color} transition-colors`}
          >
            <div className="text-2xl mb-2">{quickAction.icon}</div>
            <div className="text-base font-semibold text-gray-100">{quickAction.title}</div>
            <div className="text-sm text-gray-400 mt-1">{quickAction.desc}</div>
          </button>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={async () => {
            setResetting(true);
            setResetMsg('');
            const resetUrls = [
              `${settings.fudoUrl}/reset`,
              `${settings.matrixUrl}/reset`,
              `${settings.adUrl}/reset`,
              `${settings.snowUrl}/reset`,
              `${settings.jsmUrl}/reset`,
              `${settings.remedyUrl}/reset`,
              `${settings.cyberarkUrl}/reset`,
            ];
            const resetResults = await Promise.allSettled(
              resetUrls.map((url) => apiFetch(url, 'POST')),
            );
            const ok = resetResults.filter(
              (result) =>
                result.status === 'fulfilled' && (result.value as { status: number }).status === 200,
            ).length;
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
