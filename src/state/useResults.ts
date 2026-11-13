import { useMemo } from 'react';
import { activeFilters, filters, runQuery, sorts, type AnyFilter, type NameEntry } from '@/core';
import { useFavoritesStore } from './favoritesStore';
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
  // Le filtre « Favoris » lit cet état : le résultat doit se recalculer quand il change.
  const favoriteIds = useFavoritesStore((state) => state.ids);

  // Le tri de la liste complète n'est refait que si le tri change : la recherche et les
  // filtres conservent l'ordre, donc chaque frappe ne fait que filtrer une liste déjà triée.
  const sorted = useMemo(
    () => runQuery(entries, { sortId, direction }, { filters, sorts, loadedSources }),
    [entries, loadedSources, sortId, direction],
  );

  return useMemo(() => {
    const query = { search: { text: search, mode }, filters: filterParams };
    const context = { filters, sorts, loadedSources };
    // Ordre du registre, pas ordre d'activation : une vue rouverte par lien est identique.
    const order = filters.all();
    const active = activeFilters(query, context).sort(
      (a, b) => order.indexOf(a.filter) - order.indexOf(b.filter),
    );
    return {
      results: runQuery(sorted, query, context),
      active,
      isFiltered: active.length > 0 || search.trim() !== '',
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- favoriteIds est lu par un filtre
  }, [sorted, loadedSources, search, mode, filterParams, favoriteIds]);
}
