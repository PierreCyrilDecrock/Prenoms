import { create } from 'zustand';
import type { SearchMode, SortDirection } from '@/core';

/** Tri appliqué à l'ouverture ; ignoré par le pipeline si ce tri n'est pas disponible. */
export const DEFAULT_SORT: { sortId: string; direction: SortDirection } = {
  sortId: 'totalPopularity',
  direction: 'desc',
};

export interface QueryState {
  search: string;
  mode: SearchMode;
  /** Paramètres des filtres modifiés, par id de filtre. */
  filterParams: Record<string, unknown>;
  sortId: string;
  direction: SortDirection;
  setSearch(search: string): void;
  setMode(mode: SearchMode): void;
  setFilter(id: string, params: unknown): void;
  clearFilter(id: string): void;
  setSort(sortId: string): void;
  setDirection(direction: SortDirection): void;
  /** Efface la recherche et tous les filtres (le tri est conservé). */
  resetAll(): void;
}

export const initialQuery = {
  search: '',
  mode: 'startsWith' as SearchMode,
  filterParams: {} as Record<string, unknown>,
  ...DEFAULT_SORT,
};

/** Requête en cours : recherche, filtres et tri. */
export const useQueryStore = create<QueryState>()((set) => ({
  ...initialQuery,
  setSearch: (search) => set({ search }),
  setMode: (mode) => set({ mode }),
  setFilter: (id, params) =>
    set((state) => ({ filterParams: { ...state.filterParams, [id]: params } })),
  clearFilter: (id) =>
    set((state) => {
      const filterParams = { ...state.filterParams };
      delete filterParams[id];
      return { filterParams };
    }),
  setSort: (sortId) => set({ sortId }),
  setDirection: (direction) => set({ direction }),
  resetAll: () => set({ search: '', filterParams: {} }),
}));
