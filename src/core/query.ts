import type { AnyFilter } from './filter';
import { normalizeName } from './normalizeName';
import type { Registry } from './registry';
import type { NameEntry, Sort } from './types';

export type SearchMode = 'startsWith' | 'contains' | 'endsWith';
export type SortDirection = 'asc' | 'desc';

export interface Query {
  /** Recherche texte, insensible à la casse et aux accents. */
  search?: { text: string; mode: SearchMode };
  /** Paramètres des filtres, par id de filtre. Un id inconnu est ignoré. */
  filters?: Record<string, unknown>;
  /** Id du tri ; sans tri (ou tri inconnu), l'ordre d'entrée est conservé. */
  sortId?: string;
  /** Sens du tri, croissant par défaut. */
  direction?: SortDirection;
}

/** Ce dont le pipeline a besoin pour interpréter une requête. */
export interface QueryContext {
  filters: Pick<Registry<AnyFilter>, 'get'>;
  sorts: Pick<Registry<Sort>, 'get'>;
  /** Ids des sources chargées : un filtre ou un tri qui en requiert une autre est ignoré. */
  loadedSources: readonly string[];
}

const SELECTIVITY_SAMPLE = 200;

type Predicate = (entry: NameEntry) => boolean;

function searchPredicate(search: Query['search']): Predicate | undefined {
  const text = normalizeName(search?.text ?? '');
  if (text === '') return undefined;
  switch (search?.mode) {
    case 'contains':
      return (entry) => entry.id.includes(text);
    case 'endsWith':
      return (entry) => entry.id.endsWith(text);
    default:
      return (entry) => entry.id.startsWith(text);
  }
}

const isAvailable = (requires: readonly string[] | undefined, loaded: readonly string[]) =>
  (requires ?? []).every((sourceId) => loaded.includes(sourceId));

/** Filtres de la requête réellement applicables : connus, actifs, et dont les sources sont chargées. */
export function activeFilters(
  query: Query,
  context: QueryContext,
): { filter: AnyFilter; params: unknown }[] {
  const active: { filter: AnyFilter; params: unknown }[] = [];
  for (const [id, params] of Object.entries(query.filters ?? {})) {
    const filter = context.filters.get(id);
    if (!filter || !isAvailable(filter.requires, context.loadedSources)) continue;
    if (!filter.isActive(params)) continue;
    active.push({ filter, params });
  }
  return active;
}

/**
 * Ordonne les prédicats du plus sélectif au moins sélectif, d'après un échantillon
 * réparti sur la liste : les entrées sont éliminées le plus tôt possible.
 */
function bySelectivity(predicates: Predicate[], entries: readonly NameEntry[]): Predicate[] {
  if (predicates.length < 2 || entries.length === 0) return predicates;
  const step = Math.max(1, Math.floor(entries.length / SELECTIVITY_SAMPLE));
  return predicates
    .map((predicate) => {
      let passed = 0;
      for (let i = 0; i < entries.length; i += step) if (predicate(entries[i]!)) passed++;
      return { predicate, passed };
    })
    .sort((a, b) => a.passed - b.passed)
    .map((item) => item.predicate);
}

/** Ordre alphabétique des identifiants (déjà en minuscules et sans accents). */
const byId = (a: NameEntry, b: NameEntry) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/**
 * Pipeline de requête : recherche, filtres, tri. Fonction pure, sans React.
 * Renvoie une nouvelle liste ; `entries` n'est jamais modifiée.
 */
export function runQuery(
  entries: readonly NameEntry[],
  query: Query,
  context: QueryContext,
): NameEntry[] {
  const predicates: Predicate[] = [];
  const search = searchPredicate(query.search);
  if (search) predicates.push(search);
  for (const { filter, params } of activeFilters(query, context)) {
    predicates.push((entry) => filter.test(entry, params));
  }

  let result: NameEntry[];
  if (predicates.length === 0) {
    result = entries.slice();
  } else {
    const ordered = bySelectivity(predicates, entries);
    result = [];
    outer: for (const entry of entries) {
      for (const predicate of ordered) if (!predicate(entry)) continue outer;
      result.push(entry);
    }
  }

  const sort = query.sortId === undefined ? undefined : context.sorts.get(query.sortId);
  if (sort && isAvailable(sort.requires, context.loadedSources)) {
    const sign = query.direction === 'desc' ? -1 : 1;
    // À égalité, l'ordre alphabétique départage, quel que soit le sens : le résultat est stable.
    result.sort((a, b) => sign * sort.compare(a, b) || byId(a, b));
  }
  return result;
}
