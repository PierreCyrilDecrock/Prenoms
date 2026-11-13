import type { DataSource, DerivedField } from '@/core';
import { createNamesStore } from './namesStore';

const source = (id: string, labels: string[], extra: Partial<DataSource> = {}): DataSource => ({
  id,
  label: id,
  async load(onProgress) {
    onProgress?.(0.5);
    return { records: labels.map((label) => ({ label, facts: { from: id } })), meta: { id } };
  },
  ...extra,
});

const length: DerivedField<number> = { id: 'len', compute: (entry) => entry.id.length };

describe('namesStore', () => {
  it('démarre vide', () => {
    const state = createNamesStore([], []).getState();
    expect(state).toMatchObject({ status: 'idle', entries: [], error: null });
  });

  it('charge toutes les sources, fusionne par id et calcule les champs dérivés', async () => {
    const store = createNamesStore([source('a', ['Léa', 'Noël']), source('b', ['LEA'])], [length]);
    await store.getState().load();
    const state = store.getState();
    expect(state.status).toBe('ready');
    expect(state.entries).toEqual([
      {
        id: 'lea',
        label: 'Léa',
        derived: { len: 3 },
        facts: { a: { from: 'a' }, b: { from: 'b' } },
      },
      { id: 'noel', label: 'Noël', derived: { len: 4 }, facts: { a: { from: 'a' } } },
    ]);
    expect(state.loadedSources).toEqual(['a', 'b']);
    expect(state.sourceMeta).toEqual({ a: { id: 'a' }, b: { id: 'b' } });
    expect(state.progress).toEqual({ a: 1, b: 1 });
    expect(state.loadDurationMs).toBeGreaterThanOrEqual(0);
  });

  it('expose l’état de chargement et la progression', async () => {
    let finish!: () => void;
    const slow = source('a', ['Léa'], {
      load: (onProgress) =>
        new Promise((resolve) => {
          onProgress?.(0.4);
          finish = () => resolve({ records: [{ label: 'Léa', facts: {} }] });
        }),
    });
    const store = createNamesStore([slow], []);
    const loading = store.getState().load();
    expect(store.getState()).toMatchObject({ status: 'loading', progress: { a: 0.4 } });
    await store.getState().load(); // sans effet pendant un chargement
    finish();
    await loading;
    expect(store.getState().status).toBe('ready');
  });

  it('expose l’erreur d’une source, puis permet de réessayer', async () => {
    let fail = true;
    const flaky = source('a', ['Léa'], {
      async load() {
        if (fail) throw new Error('réseau indisponible');
        return { records: [{ label: 'Léa', facts: {} }] };
      },
    });
    const store = createNamesStore([flaky], []);
    await store.getState().load();
    expect(store.getState()).toMatchObject({
      status: 'error',
      error: 'réseau indisponible',
      entries: [],
    });
    fail = false;
    await store.getState().load();
    expect(store.getState()).toMatchObject({ status: 'ready', error: null });
    expect(store.getState().entries).toHaveLength(1);
  });

  it('vide les caches puis recharge', async () => {
    const clearCache = vi.fn(async () => undefined);
    const store = createNamesStore([source('a', ['Léa'], { clearCache }), source('b', [])], []);
    await store.getState().clearCachesAndReload();
    expect(clearCache).toHaveBeenCalledOnce();
    expect(store.getState().status).toBe('ready');
  });
});
