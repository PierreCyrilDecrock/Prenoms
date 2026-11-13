import { filters, sorts, type SearchMode, type SortDirection } from '@/core';
import { DEFAULT_SORT, initialQuery } from './queryStore';

/** Partie de la requête qui vit dans l'URL. */
export interface UrlQuery {
  search: string;
  mode: SearchMode;
  filterParams: Record<string, unknown>;
  sortId: string;
  direction: SortDirection;
}

/*
 * Format du hash : #/?q=mar&m=c&f.gender=f&f.length=3-6&s=alphabetical&d=asc
 *   q  texte recherché            m  mode (s, c, e ; « commence par » omis)
 *   f.<id>  paramètres d'un filtre actif, écrits par son toUrl
 *   s  tri, d  sens (omis quand ils valent le tri par défaut)
 */
const MODE_CODES: Record<SearchMode, string> = { startsWith: 's', contains: 'c', endsWith: 'e' };
const FILTER_PREFIX = 'f.';

/** Paramètres des filtres actifs seulement, dans l'ordre du registre. */
export function activeFilterParams(filterParams: Record<string, unknown>): [string, unknown][] {
  return filters
    .all()
    .filter((filter) => filter.id in filterParams && filter.isActive(filterParams[filter.id]))
    .map((filter) => [filter.id, filterParams[filter.id]]);
}

/** Écrit la requête sous forme de chaîne de paramètres (sans « ? »). Forme canonique. */
export function serializeQuery(query: UrlQuery): string {
  const params = new URLSearchParams();
  if (query.search.trim() !== '') params.set('q', query.search);
  if (query.mode !== initialQuery.mode) params.set('m', MODE_CODES[query.mode]);
  for (const [id, value] of activeFilterParams(query.filterParams)) {
    params.set(FILTER_PREFIX + id, filters.get(id)!.toUrl(value));
  }
  if (query.sortId !== DEFAULT_SORT.sortId || query.direction !== DEFAULT_SORT.direction) {
    params.set('s', query.sortId);
    params.set('d', query.direction);
  }
  return params.toString();
}

/** Lit une chaîne de paramètres. Tout paramètre inconnu ou invalide est ignoré, sans erreur. */
export function parseQuery(queryString: string): UrlQuery {
  const params = new URLSearchParams(queryString);
  const modeCode = params.get('m');
  const mode =
    (Object.keys(MODE_CODES) as SearchMode[]).find((item) => MODE_CODES[item] === modeCode) ??
    initialQuery.mode;

  const filterParams: Record<string, unknown> = {};
  for (const [key, value] of params) {
    if (!key.startsWith(FILTER_PREFIX)) continue;
    const filter = filters.get(key.slice(FILTER_PREFIX.length));
    if (!filter) continue;
    try {
      const parsed: unknown = filter.fromUrl(value);
      if (filter.isActive(parsed)) filterParams[filter.id] = parsed;
    } catch {
      // Un filtre qui échoue à lire sa valeur est ignoré.
    }
  }

  const sortId = params.get('s');
  const direction = params.get('d');
  const knownSort = sortId !== null && sorts.has(sortId);
  return {
    search: params.get('q') ?? '',
    mode,
    filterParams,
    sortId: knownSort ? sortId : DEFAULT_SORT.sortId,
    direction: knownSort
      ? direction === 'asc' || direction === 'desc'
        ? direction
        : 'asc'
      : DEFAULT_SORT.direction,
  };
}

/** Partie « paramètres » du hash courant (« #/?q=a » donne « q=a »). */
export function hashQueryString(hash: string = window.location.hash): string {
  const index = hash.indexOf('?');
  return index < 0 ? '' : hash.slice(index + 1);
}

/** Adresse de la liste qui restaure la requête donnée. */
export function listHref(query: UrlQuery): string {
  const serialized = serializeQuery(query);
  return serialized ? `#/?${serialized}` : '#/';
}

/**
 * Vrai si le passage d'une requête à l'autre est un changement discret (nouvelle entrée
 * d'historique) : mode, tri, sens, ou filtre ajouté ou retiré. Une frappe (texte recherché,
 * valeur d'un filtre déjà actif) remplace l'entrée courante.
 */
export function isDiscreteChange(previous: UrlQuery, next: UrlQuery): boolean {
  if (
    previous.mode !== next.mode ||
    previous.sortId !== next.sortId ||
    previous.direction !== next.direction
  ) {
    return true;
  }
  const ids = (query: UrlQuery) =>
    activeFilterParams(query.filterParams)
      .map(([id]) => id)
      .join(',');
  return ids(previous) !== ids(next);
}
