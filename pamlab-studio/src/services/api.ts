import type { AppSettings } from '../types';

const defaultSettings: AppSettings = {
  fudoUrl: '/api/fudo',
  matrixUrl: '/api/matrix42',
  adUrl: '/api/ad',
  snowUrl: '/api/snow',
  jsmUrl: '/api/jsm',
  remedyUrl: '/api/remedy',
  fudoUser: 'admin',
  fudoPass: 'admin',
  theme: 'dark',
  exportFormat: 'powershell',
};

export function getSettings(): AppSettings {
  try {
    const s = localStorage.getItem('pamlab-settings');
    return s ? { ...defaultSettings, ...JSON.parse(s) } : defaultSettings;
  } catch { return defaultSettings; }
}

export function saveSettings(s: AppSettings) {
  localStorage.setItem('pamlab-settings', JSON.stringify(s));
}

function authHeader(settings: AppSettings) {
  return { Authorization: 'Basic ' + btoa(settings.fudoUser + ':' + settings.fudoPass) };
}

export async function checkHealth(url: string): Promise<{ healthy: boolean; responseTime: number | null }> {
  const start = performance.now();
  try {
    const res = await fetch(url + '/health', { signal: AbortSignal.timeout(5000) });
    return { healthy: res.ok, responseTime: Math.round(performance.now() - start) };
  } catch {
    return { healthy: false, responseTime: null };
  }
}

export async function apiFetch(url: string, method: string, body?: unknown): Promise<{ status: number; statusText: string; data: unknown; time: number }> {
  const settings = getSettings();
  const start = performance.now();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeader(settings),
  };
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(10000),
    });
    const time = Math.round(performance.now() - start);
    let data: unknown;
    try { data = await res.json(); } catch { data = null; }
    return { status: res.status, statusText: res.statusText, data, time };
  } catch (e) {
    return { status: 0, statusText: String(e), data: null, time: Math.round(performance.now() - start) };
  }
}
