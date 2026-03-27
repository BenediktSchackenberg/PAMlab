import { useState } from 'react';
import type { AppSettings } from '../types';
import { getSettings, saveSettings } from '../services/api';

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [saved, setSaved] = useState(false);

  const update = (key: keyof AppSettings, value: string) => {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const fields: { key: keyof AppSettings; label: string; type?: string }[] = [
    { key: 'fudoUrl', label: 'Fudo PAM URL' },
    { key: 'matrixUrl', label: 'Matrix42 ESM URL' },
    { key: 'adUrl', label: 'Active Directory URL' },
    { key: 'snowUrl', label: 'ServiceNow ITSM URL' },
    { key: 'jsmUrl', label: 'Jira Service Mgmt URL' },
    { key: 'remedyUrl', label: 'BMC Remedy / Helix URL' },
    { key: 'fudoUser', label: 'API Username' },
    { key: 'fudoPass', label: 'API Password', type: 'password' },
  ];

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-100 mb-6">Settings</h2>

      <div className="space-y-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="block text-sm text-gray-400 mb-1">{f.label}</label>
            <input
              type={f.type || 'text'}
              value={settings[f.key] as string}
              onChange={(e) => update(f.key, e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 font-mono text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
        ))}

        <div>
          <label className="block text-sm text-gray-400 mb-1">Export Format</label>
          <select
            value={settings.exportFormat}
            onChange={(e) => update('exportFormat', e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-gray-100 text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="powershell">PowerShell</option>
            <option value="python">Python</option>
          </select>
        </div>

        <button onClick={handleSave} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
          {saved ? '✅ Saved!' : '💾 Save Settings'}
        </button>
      </div>
    </div>
  );
}
