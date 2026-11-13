import { normalizeName } from './normalizeName';
import { runToEnd } from './slices';
import type { DerivedField, NameEntry, SourceData } from './types';

/** Données d'une source chargée, prêtes à être fusionnées. */
export interface LoadedSource {
  /** Id de la source : clé de ses faits dans NameEntry.facts. */
  id: string;
  data: SourceData;
}

/** Nombre de prénoms traités entre deux points où le traitement peut rendre la main. */
const STEP_SIZE = 1000;

/**
 * Fusionne les sources en une liste de NameEntry, puis calcule les champs dérivés.
 *
 * - La clé de fusion est normalizeName(label). La forme d'affichage est celle de la
 *   première source qui fournit le prénom.
 * - Chaque source range ses faits sous sa propre clé : deux sources ne s'écrasent jamais.
 * - Un champ calculé n'est évalué que pour les prénoms qui ont les faits de toutes
 *   les sources qu'il requiert.
 */
export function mergeSources(
  loaded: readonly LoadedSource[],
  fields: readonly DerivedField[],
): NameEntry[] {
  return runToEnd(mergeSourcesSteps(loaded, fields));
}

/** Même traitement que mergeSources, en générateur : à exécuter avec runInSlices. */
export function* mergeSourcesSteps(
  loaded: readonly LoadedSource[],
  fields: readonly DerivedField[],
): Generator<void, NameEntry[]> {
  const byId = new Map<string, NameEntry>();
  let done = 0;

  for (const source of loaded) {
    for (const record of source.data.records) {
      const id = normalizeName(record.label);
      if (id !== '') {
        let entry = byId.get(id);
        if (!entry) {
          entry = { id, label: record.label, derived: {}, facts: {} };
          byId.set(id, entry);
        }
        entry.facts[source.id] = record.facts;
      }
      if (++done % STEP_SIZE === 0) yield;
    }
  }

  const entries = [...byId.values()];
  for (const field of fields) {
    const requires = field.requires ?? [];
    for (const entry of entries) {
      if (requires.every((sourceId) => sourceId in entry.facts)) {
        entry.derived[field.id] = field.compute(entry);
      }
      if (++done % STEP_SIZE === 0) yield;
    }
  }
  return entries;
}
