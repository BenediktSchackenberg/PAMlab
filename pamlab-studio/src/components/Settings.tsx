import { useState, useRef } from 'react';
import type { AppSettings } from '../types';
import { getSettings, saveSettings } from '../services/api';
import {
  type SystemConfig,
  generateProductionConfigTemplate,
  loadProductionConfig,
  saveProductionConfig,
  exportConfigAsJson,
} from '../services/productionConfig';

type SettingsTab = 'mock' | 'production' | 'preferences';

const KEYBOARD_SHORTCUTS = [
  { keys: 'Ctrl+1–5', desc: 'Navigate pages' },
  { keys: 'Ctrl+Enter', desc: 'Run script' },
  { keys: 'Ctrl+S', desc: 'Save script' },
  { keys: 'Ctrl+E', desc: 'Export script' },
  { keys: 'Ctrl+Shift+E', desc: 'Export for Production' },
];

export default function Settings() {
  const [tab, setTab] = useState<SettingsTab>('mock');
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [saved, setSaved] = useState(false);
  const [prodConfigs, setProdConfigs] = useState<SystemConfig[]>(
    loadProductionConfig() || generateProductionConfigTemplate()
  );
  const [prodSaved, setProdSaved] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, 'ok' | 'fail' | 'testing'>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Mock API settings ─────────────────────────────────────────
  const update = (key: keyof AppSettings, value: string) => {
    setSettings(s => ({ ...s, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // ── Production Config ─────────────────────────────────────────
  const updateProdConfig = (id: string, field: string, value: string) => {
    setProdConfigs(prev => prev.map(c => {
      if (c.id !== id) return c;
      if (field === 'baseUrl') return { ...c, baseUrl: value };
      return { ...c, auth: { ...c.auth, [field]: value } as SystemConfig['auth'] };
    }));
    setProdSaved(false);
  };

  const handleProdSave = () => {
    saveProductionConfig(prodConfigs);
    setProdSaved(true);
    setTimeout(() => setProdSaved(false), 2000);
  };

  const handleProdExport = () => {
    const json = exportConfigAsJson(prodConfigs);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pamlab-config.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleProdImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result as string) as SystemConfig[];
        setProdConfigs(imported);
        setProdSaved(false);
      } catch {
        alert('Invalid config file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleTestConnection = async (config: SystemConfig) => {
    setTestResults(r => ({ ...r, [config.id]: 'testing' }));
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      await fetch(config.baseUrl, { method: 'HEAD', mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeout);
      setTestResults(r => ({ ...r, [config.id]: 'ok' }));
    } catch {
      setTestResults(r => ({ ...r, [config.id]: 'fail' }));
    }
    setTimeout(() => setTestResults(r => { const n = { ...r }; delete n[config.id]; return n; }), 3000);
  };

  const mockFields: { key: keyof AppSettings; label: string; system: string; type?: string }[] = [
    { key: 'fudoUrl', label: 'Mock API URL', system: 'Fudo PAM' },
    { key: 'matrixUrl', label: 'Mock API URL', system: 'Matrix42 ESM' },
    { key: 'adUrl', label: 'Mock API URL', system: 'Active Directory' },
    { key: 'snowUrl', label: 'Mock API URL', system: 'ServiceNow ITSM' },
    { key: 'jsmUrl', label: 'Mock API URL', system: 'Jira Service Mgmt' },
    { key: 'remedyUrl', label: 'Mock API URL', system: 'BMC Remedy / Helix' },
    { key: 'cyberarkUrl', label: 'Mock API URL', system: 'CyberArk PVWA' },
    { key: 'fudoUser', label: 'API Username', system: 'Credentials' },
    { key: 'fudoPass', label: 'API Password', system: 'Credentials', type: 'password' },
  ];

  const renderAuthFields = (config: SystemConfig) => {
    const inputClass = 'w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 font-mono text-sm focus:outline-none focus:border-blue-500';
    switch (config.auth.method) {
      case 'api-token':
        return (
          <div>
            <label className="block text-xs text-gray-500 mb-1">API Token</label>
            <input type="password" value={config.auth.token} onChange={e => updateProdConfig(config.id, 'token', e.target.value)} className={inputClass} placeholder="Bearer token" />
          </div>
        );
      case 'basic':
        return (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Username</label>
              <input type="text" value={config.auth.username} onChange={e => updateProdConfig(config.id, 'username', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Password</label>
              <input type="password" value={config.auth.password} onChange={e => updateProdConfig(config.id, 'password', e.target.value)} className={inputClass} />
            </div>
          </>
        );
      case 'ldap-bind':
        return (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bind DN</label>
              <input type="text" value={config.auth.bindDN} onChange={e => updateProdConfig(config.id, 'bindDN', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Password</label>
              <input type="password" value={config.auth.password} onChange={e => updateProdConfig(config.id, 'password', e.target.value)} className={inputClass} />
            </div>
          </>
        );
      case 'oauth2':
        return (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Client ID</label>
              <input type="text" value={config.auth.clientId} onChange={e => updateProdConfig(config.id, 'clientId', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Client Secret</label>
              <input type="password" value={config.auth.clientSecret} onChange={e => updateProdConfig(config.id, 'clientSecret', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Token URL</label>
              <input type="text" value={config.auth.tokenUrl} onChange={e => updateProdConfig(config.id, 'tokenUrl', e.target.value)} className={inputClass} />
            </div>
          </>
        );
      case 'api-key':
        return (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Header Name</label>
              <input type="text" value={config.auth.headerName} onChange={e => updateProdConfig(config.id, 'headerName', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">API Key</label>
              <input type="password" value={config.auth.apiKey} onChange={e => updateProdConfig(config.id, 'apiKey', e.target.value)} className={inputClass} />
            </div>
          </>
        );
    }
  };

  const tabClass = (t: SettingsTab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${tab === t ? 'bg-gray-800 text-white border-b-2 border-blue-500' : 'text-gray-400 hover:text-gray-200'}`;

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">⚙️ Settings</h2>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-700">
        <button className={tabClass('mock')} onClick={() => setTab('mock')}>🧪 Mock APIs</button>
        <button className={tabClass('production')} onClick={() => setTab('production')}>🏭 Production Config</button>
        <button className={tabClass('preferences')} onClick={() => setTab('preferences')}>🎨 Preferences</button>
      </div>

      {/* Tab 1: Mock APIs */}
      {tab === 'mock' && (
        <div className="space-y-6">
          <p className="text-sm text-gray-400">Configure mock API endpoints for local development and testing.</p>

          {/* Group by system */}
          {['Fudo PAM', 'Matrix42 ESM', 'Active Directory', 'ServiceNow ITSM', 'Jira Service Mgmt', 'BMC Remedy / Helix', 'CyberArk PVWA', 'Credentials'].map(system => {
            const systemFields = mockFields.filter(f => f.system === system);
            return (
              <div key={system} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <h3 className="text-sm font-medium text-gray-300 mb-3">{system}</h3>
                <div className="space-y-3">
                  {systemFields.map(f => (
                    <div key={f.key}>
                      <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                      <input
                        type={f.type || 'text'}
                        value={settings[f.key] as string}
                        onChange={e => update(f.key, e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 font-mono text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <button onClick={handleSave} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            {saved ? '✅ Saved!' : '💾 Save Settings'}
          </button>
        </div>
      )}

      {/* Tab 2: Production Config */}
      {tab === 'production' && (
        <div className="space-y-6">
          <p className="text-sm text-gray-400">Configure real system connections for production script export.</p>

          {prodConfigs.map(config => (
            <div key={config.id} className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-300">{config.name}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-700 rounded">{config.auth.method}</span>
                  <button
                    onClick={() => handleTestConnection(config)}
                    className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                  >
                    {testResults[config.id] === 'testing' ? '⏳' : testResults[config.id] === 'ok' ? '✅' : testResults[config.id] === 'fail' ? '❌' : '🔌'} Test
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Base URL</label>
                  <input
                    type="text"
                    value={config.baseUrl}
                    onChange={e => updateProdConfig(config.id, 'baseUrl', e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 font-mono text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                {renderAuthFields(config)}
              </div>
            </div>
          ))}

          <div className="flex gap-2">
            <button onClick={handleProdSave} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              {prodSaved ? '✅ Saved!' : '💾 Save Config'}
            </button>
            <button onClick={handleProdExport} className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">
              📤 Export Config
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-colors">
              📥 Import Config
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleProdImport} className="hidden" />
          </div>
        </div>
      )}

      {/* Tab 3: Preferences */}
      {tab === 'preferences' && (
        <div className="space-y-6">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Export Format</h3>
            <select
              value={settings.exportFormat}
              onChange={e => update('exportFormat', e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-gray-100 text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="powershell">PowerShell</option>
              <option value="python">Python</option>
            </select>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Theme</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">🌙 Dark</span>
              <div className="w-10 h-5 bg-blue-600 rounded-full relative cursor-not-allowed opacity-60">
                <div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5" />
              </div>
              <span className="text-sm text-gray-500">☀️ Light</span>
              <span className="text-xs text-gray-600 ml-2">(coming soon)</span>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-medium text-gray-300 mb-3">⌨️ Keyboard Shortcuts</h3>
            <div className="space-y-2">
              {KEYBOARD_SHORTCUTS.map(s => (
                <div key={s.keys} className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">{s.desc}</span>
                  <kbd className="px-2 py-1 bg-gray-700 rounded text-xs text-gray-300 font-mono">{s.keys}</kbd>
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleSave} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            {saved ? '✅ Saved!' : '💾 Save Preferences'}
          </button>
        </div>
      )}
    </div>
  );
}
