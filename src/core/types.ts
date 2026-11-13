/**
 * Contrats métier de l'application. Aucune dépendance à React ici :
 * le seul contrat lié à l'interface (Filter, pour son Control) est dans filter.ts.
 */

/** Un prénom, fusionné depuis toutes les sources chargées. */
export interface NameEntry {
  /** Forme normalisée (minuscules, sans accents) : clé de fusion entre sources. */
  id: string;
  /** Forme d'affichage. */
  label: string;
  /** Champs calculés, un par DerivedField (derived.length, derived.initial…). */
  derived: Record<string, unknown>;
  /** Un bloc par source, sous l'id de la source (facts.insee…). */
  facts: Record<string, unknown>;
}

/** Un prénom tel que fourni par une source, avant fusion. */
export interface SourceRecord {
  /** Forme d'affichage ; le cœur en déduit l'id avec normalizeName(). */
  label: string;
  /** Faits de cette source pour ce prénom ; rangés sous facts[<id de la source>]. */
  facts: unknown;
}

/** Résultat du chargement d'une source. */
export interface SourceData {
  records: SourceRecord[];
  /** Informations libres sur le chargement (version, date, provenance du cache…). */
  meta?: Record<string, unknown>;
}

/** Source de données : src/sources/<id>/index.ts */
export interface DataSource {
  id: string;
  label: string;
  /** onProgress reçoit une valeur entre 0 et 1. */
  load(onProgress?: (progress: number) => void): Promise<SourceData>;
  /** Vide le cache local de la source, si elle en a un. */
  clearCache?(): Promise<void>;
}

/** Champ calculé : src/derived/<id>.ts */
export interface DerivedField<V = unknown> {
  id: string;
  /** Sources nécessaires au calcul ; sans elles, le champ n'est pas calculé. */
  requires?: string[];
  compute(entry: NameEntry): V;
}

/** Tri : src/sorts/<id>.ts. Le sens (croissant ou décroissant) est géré par le pipeline. */
export interface Sort {
  id: string;
  label: string;
  /** Ids des sources nécessaires ; l'interface masque le tri si elles manquent. */
  requires?: string[];
  compare(a: NameEntry, b: NameEntry): number;
}
