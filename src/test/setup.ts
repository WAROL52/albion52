import { afterEach, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

const realFetch = globalThis.fetch;

vi.stubGlobal('fetch', vi.fn(async () => {
  return { ok: true, json: async () => [] } as Response;
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.stubGlobal('fetch', vi.fn(async () => {
    return { ok: true, json: async () => [] } as Response;
  }));
});

export { realFetch };
