import { afterEach, describe, expect, it } from 'vitest';
import { getDefaultSettings, getSettings } from './api';

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

describe('api settings', () => {
  it('reads runtime config defaults for the static deployment', () => {
    const globals = globalThis as RuntimeGlobals;
    globals.__PAMLAB_CONFIG__ = {
      fudoUrl: 'http://localhost:8443',
      cyberarkUrl: 'http://localhost:8450',
    };

    const settings = getDefaultSettings();

    expect(settings.fudoUrl).toBe('http://localhost:8443');
    expect(settings.cyberarkUrl).toBe('http://localhost:8450');
    expect(settings.matrixUrl).toBe('/api/matrix42');
  });

  it('merges saved settings over runtime defaults', () => {
    const globals = globalThis as RuntimeGlobals;
    globals.__PAMLAB_CONFIG__ = {
      fudoUrl: 'http://localhost:8443',
      matrixUrl: 'http://localhost:8444',
    };
    globals.localStorage = createLocalStorage();
    globals.localStorage.setItem(
      'pamlab-settings',
      JSON.stringify({
        matrixUrl: 'http://custom-matrix42:9444',
        theme: 'light',
      }),
    );

    const settings = getSettings();

    expect(settings.fudoUrl).toBe('http://localhost:8443');
    expect(settings.matrixUrl).toBe('http://custom-matrix42:9444');
    expect(settings.theme).toBe('light');
  });
});
