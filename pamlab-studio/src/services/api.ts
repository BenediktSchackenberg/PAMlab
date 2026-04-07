import type { AppSettings } from '../types';

type RuntimeConfig = Partial<
  Pick<
    AppSettings,
    | 'fudoUrl'
    | 'matrixUrl'
    | 'adUrl'
    | 'azureAdUrl'
    | 'snowUrl'
    | 'jsmUrl'
    | 'remedyUrl'
    | 'cyberarkUrl'
    | 'fudoUser'
    | 'fudoPass'
  >
>;

function readRuntimeConfig(): RuntimeConfig {
  const root = globalThis as typeof globalThis & { __PAMLAB_CONFIG__?: RuntimeConfig };
  return root.__PAMLAB_CONFIG__ || {};
}

export function getDefaultSettings(overrides: Partial<AppSettings> = {}): AppSettings {
  return {
    fudoUrl: '/api/fudo',
    matrixUrl: '/api/matrix42',
    adUrl: '/api/ad',
    azureAdUrl: '/api/azure-ad',
    snowUrl: '/api/snow',
    jsmUrl: '/api/jsm',
    remedyUrl: '/api/remedy',
    cyberarkUrl: '/api/cyberark',
    fudoUser: 'admin',
    fudoPass: 'admin',
    theme: 'dark',
    exportFormat: 'powershell',
    ...readRuntimeConfig(),
    ...overrides,
  };
}

export function getSettings(): AppSettings {
  const defaults = getDefaultSettings();
  try {
    const stored = localStorage.getItem('pamlab-settings');
    return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
  } catch {
    return defaults;
  }
}

export function saveSettings(settings: AppSettings) {
  localStorage.setItem('pamlab-settings', JSON.stringify(settings));
}

function authHeader(settings: AppSettings) {
  return { Authorization: 'Basic ' + btoa(settings.fudoUser + ':' + settings.fudoPass) };
}

export async function checkHealth(
  url: string,
): Promise<{ healthy: boolean; responseTime: number | null }> {
  const start = performance.now();
  try {
    const res = await fetch(url + '/health', { signal: AbortSignal.timeout(5000) });
    return { healthy: res.ok, responseTime: Math.round(performance.now() - start) };
  } catch {
    return { healthy: false, responseTime: null };
  }
}

export async function apiFetch(
  url: string,
  method: string,
  body?: unknown,
): Promise<{ status: number; statusText: string; data: unknown; time: number }> {
  const settings = getSettings();
  const start = performance.now();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeader(settings),
  };

  let processedBody = body;
  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const obj = body as Record<string, unknown>;
    processedBody = Object.fromEntries(
      Object.entries(obj).map(([key, value]) => {
        if (value === 'true') return [key, true];
        if (value === 'false') return [key, false];
        if (
          typeof value === 'string' &&
          /^\d+$/.test(value) &&
          ['max_duration_hours', 'duration_hours', 'port'].includes(key)
        ) {
          return [key, parseInt(value, 10)];
        }
        if (typeof value === 'string' && value.startsWith('[')) {
          try {
            return [key, JSON.parse(value)];
          } catch {
            return [key, value];
          }
        }
        return [key, value];
      }),
    );
  }

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: processedBody ? JSON.stringify(processedBody) : undefined,
      signal: AbortSignal.timeout(10000),
    });
    const time = Math.round(performance.now() - start);
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, statusText: res.statusText, data, time };
  } catch (error) {
    return {
      status: 0,
      statusText: String(error),
      data: null,
      time: Math.round(performance.now() - start),
    };
  }
}
