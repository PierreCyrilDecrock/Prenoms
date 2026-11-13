import { create } from 'zustand';
import {
  derivedFields,
  mergeSources,
  sources,
  type DataSource,
  type DerivedField,
  type LoadedSource,
  type NameEntry,
} from '@/core';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface NamesState {
  status: LoadStatus;
  /** Prénoms fusionnés de toutes les sources, avec leurs champs calculés. */
  entries: NameEntry[];
  /** Message d'erreur du dernier chargement, s'il a échoué. */
  error: string | null;
  /** Progression de chaque source, entre 0 et 1. */
  progress: Record<string, number>;
  /** Ids des sources chargées (pour le `requires` des filtres et des tris). */
  loadedSources: string[];
  /** Bloc meta renvoyé par chaque source (version, provenance du cache…). */
  sourceMeta: Record<string, Record<string, unknown>>;
  /** Durée du dernier chargement complet, en millisecondes. */
  loadDurationMs: number | null;
  /** Charge toutes les sources enregistrées. Sans effet si un chargement est en cours. */
  load(): Promise<void>;
  /** Vide le cache local des sources, puis recharge. */
  clearCachesAndReload(): Promise<void>;
}

const initial = {
  status: 'idle' as LoadStatus,
  entries: [] as NameEntry[],
  error: null,
  progress: {},
  loadedSources: [] as string[],
  sourceMeta: {},
  loadDurationMs: null,
};

/** Crée un store pour un jeu de sources et de champs calculés (injectables pour les tests). */
export function createNamesStore(
  sourceList: readonly DataSource[],
  fieldList: readonly DerivedField[],
) {
  return create<NamesState>()((set, get) => ({
    ...initial,

    async load() {
      if (get().status === 'loading') return;
      const startedAt = performance.now();
      set({ ...initial, status: 'loading' });
      try {
        const loaded: LoadedSource[] = await Promise.all(
          sourceList.map(async (source) => {
            const data = await source.load((value) =>
              set((state) => ({ progress: { ...state.progress, [source.id]: value } })),
            );
            return { id: source.id, data };
          }),
        );
        set({
          status: 'ready',
          entries: mergeSources(loaded, fieldList),
          loadedSources: loaded.map((source) => source.id),
          sourceMeta: Object.fromEntries(
            loaded.map((source) => [source.id, source.data.meta ?? {}]),
          ),
          progress: Object.fromEntries(loaded.map((source) => [source.id, 1])),
          loadDurationMs: performance.now() - startedAt,
        });
      } catch (error) {
        set({
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },

    async clearCachesAndReload() {
      if (get().status === 'loading') return;
      await Promise.all(sourceList.map((source) => source.clearCache?.().catch(() => undefined)));
      await get().load();
    },
  }));
}

/** Store de l'application : toutes les sources et tous les champs calculés des registres. */
export const useNamesStore = createNamesStore(sources.all(), derivedFields.all());
