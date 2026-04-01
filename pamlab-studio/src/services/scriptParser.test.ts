import { afterEach, describe, expect, it } from 'vitest';
import { parseScript } from './scriptParser';

type RuntimeGlobals = typeof globalThis & {
  __PAMLAB_CONFIG__?: Record<string, string>;
  localStorage?: Storage;
};

function createLocalStorage() {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] || null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  } satisfies Storage;
}

afterEach(() => {
  const globals = globalThis as RuntimeGlobals;
  Reflect.deleteProperty(globals, '__PAMLAB_CONFIG__');
  Reflect.deleteProperty(globals, 'localStorage');
});

describe('scriptParser', () => {
  it('parses generated PowerShell variables, urls and bodies', () => {
    const globals = globalThis as RuntimeGlobals;
    globals.localStorage = createLocalStorage();
    globals.__PAMLAB_CONFIG__ = {
      adUrl: 'http://localhost:8445',
    };

    const script = [
      '$adBase = "http://localhost:8445"',
      '$step1Body = @{',
      '  sAMAccountName = "j.doe"',
      '  enabled = $true',
      '  members = @("j.doe")',
      '}',
      'Invoke-RestMethod -Uri "$adBase/api/users" -Method POST -Body ($step1Body | ConvertTo-Json) -ContentType "application/json" -Headers $headers',
    ].join('\n');

    const calls = parseScript(script);

    expect(calls).toHaveLength(1);
    expect(calls[0]).toEqual({
      method: 'POST',
      url: 'http://localhost:8445/api/users',
      body: {
        sAMAccountName: 'j.doe',
        enabled: 'true',
        members: '["j.doe"]',
      },
    });
  });

  it('resolves runtime-config backed CyberArk urls', () => {
    const globals = globalThis as RuntimeGlobals;
    globals.localStorage = createLocalStorage();
    globals.__PAMLAB_CONFIG__ = {
      cyberarkUrl: 'http://localhost:8450',
    };

    const script = 'Invoke-RestMethod -Uri "$cyberarkBase/api/Safes" -Method GET -Headers $headers';
    const calls = parseScript(script);

    expect(calls[0]?.url).toBe('http://localhost:8450/api/Safes');
  });
});
