import { useMemo } from 'react';
import { activeFilters, filters, runQuery, sorts, type AnyFilter, type NameEntry } from '@/core';
import { useNamesStore } from './namesStore';
import { useQueryStore } from './queryStore';

export interface Results {
  /** Prénoms filtrés et triés. */
  results: NameEntry[];
  /** Filtres réellement appliqués, avec leurs paramètres. */
  active: { filter: AnyFilter; params: unknown }[];
  /** Vrai si une recherche ou un filtre restreint la liste. */
  isFiltered: boolean;
}

/** Résultat de la requête en cours sur les prénoms chargés. */
export function useResults(): Results {
  const entries = useNamesStore((state) => state.entries);
  const loadedSources = useNamesStore((state) => state.loadedSources);
  const search = useQueryStore((state) => state.search);
  const mode = useQueryStore((state) => state.mode);
  const filterParams = useQueryStore((state) => state.filterParams);
  const sortId = useQueryStore((state) => state.sortId);
  const direction = useQueryStore((state) => state.direction);

  return useMemo(() => {
    const query = { search: { text: search, mode }, filters: filterParams, sortId, direction };
    const context = { filters, sorts, loadedSources };
    const active = activeFilters(query, context);
    return {
      results: runQuery(entries, query, context),
      active,
      isFiltered: active.length > 0 || search.trim() !== '',
    };
  }, [entries, loadedSources, search, mode, filterParams, sortId, direction]);
}
