import type { NameEntry } from '@/core';
import { birthsInYear, countAt, getInseeFacts, getInseeYearRange } from '@/sources/insee/facts';

/*
 * Seul point de l'interface qui connaît la source INSEE : il traduit ses faits en valeurs
 * prêtes à afficher (ligne de résultat et fiche). Les composants n'y lisent que des nombres.
 */

export interface NameStats {
  total: number;
  female: number;
  male: number;
  /** Part féminine, entre 0 et 1. */
  femaleShare: number;
  firstYear: number;
  lastYear: number;
  peakYear: number;
  peakCount: number;
  /** Première année de la plage affichée ; les séries commencent à cette année. */
  startYear: number;
  /** Naissances par année, les deux sexes confondus. */
  yearly(): number[];
  /** Naissances par année pour chaque sexe. */
  yearlyBySex(): { female: number[]; male: number[] };
}

function series(read: (year: number) => number): number[] {
  const { min, max } = getInseeYearRange();
  const values: number[] = [];
  for (let year = min; year <= max; year++) values.push(read(year));
  return values;
}

/** Statistiques d'affichage d'un prénom, ou undefined s'il n'a pas de données INSEE. */
export function getNameStats(entry: NameEntry): NameStats | undefined {
  const facts = getInseeFacts(entry);
  if (!facts) return undefined;
  return {
    total: facts.total,
    female: facts.female,
    male: facts.male,
    femaleShare: facts.total > 0 ? facts.female / facts.total : 0,
    firstYear: facts.firstYear,
    lastYear: facts.lastYear,
    peakYear: facts.peakYear,
    peakCount: facts.peakCount,
    startYear: getInseeYearRange().min,
    yearly: () => series((year) => birthsInYear(facts, year)),
    yearlyBySex: () => ({
      female: series((year) => countAt(facts.byYear.female, year)),
      male: series((year) => countAt(facts.byYear.male, year)),
    }),
  };
}
