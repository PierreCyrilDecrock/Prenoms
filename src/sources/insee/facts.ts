import type { NameEntry, SourceRecord } from '@/core';
import type { InseeData, InseeSeries } from './format';

export const INSEE_SOURCE_ID = 'insee';

/** Série annuelle d'un sexe : counts[0] est l'effectif de l'année `start`. */
export interface YearSeries {
  start: number;
  counts: number[];
}

/** Faits INSEE d'un prénom, rangés sous facts.insee. */
export interface InseeFacts {
  /** Naissances cumulées (années connues uniquement). */
  total: number;
  male: number;
  female: number;
  /** Série annuelle compacte par sexe ; null si aucune naissance pour ce sexe. */
  byYear: { male: YearSeries | null; female: YearSeries | null };
  /** Première et dernière année où le prénom apparaît. */
  firstYear: number;
  lastYear: number;
  /** Année du plus grand effectif (les deux sexes confondus) ; la plus ancienne à égalité. */
  peakYear: number;
  peakCount: number;
  /** Naissances sur les TREND_WINDOW dernières années de la source. */
  recent: number;
  /** Naissances sur les TREND_WINDOW années précédentes. */
  previous: number;
}

/** Largeur, en années, des deux fenêtres comparées pour la tendance et la popularité récente. */
export const TREND_WINDOW = 10;

const yearRange = { min: 1900, max: new Date().getFullYear() };

/** Plage d'années couverte par la source (connue après son chargement). */
export function getInseeYearRange(): Readonly<{ min: number; max: number }> {
  return yearRange;
}

/** Faits INSEE d'un prénom, s'il vient de cette source. */
export function getInseeFacts(entry: NameEntry): InseeFacts | undefined {
  return entry.facts[INSEE_SOURCE_ID] as InseeFacts | undefined;
}

/** Effectif d'une série pour une année donnée (0 hors de la série). */
export function countAt(series: YearSeries | null, year: number): number {
  return series?.counts[year - series.start] ?? 0;
}

/** Naissances d'un prénom pour une année, les deux sexes confondus. */
export function birthsInYear(facts: InseeFacts, year: number): number {
  return countAt(facts.byYear.male, year) + countAt(facts.byYear.female, year);
}

/** Naissances d'un prénom entre deux années incluses, les deux sexes confondus. */
export function birthsBetween(facts: InseeFacts, fromYear: number, toYear: number): number {
  let total = 0;
  const from = Math.max(fromYear, facts.firstYear);
  const to = Math.min(toYear, facts.lastYear);
  for (let year = from; year <= to; year++) total += birthsInYear(facts, year);
  return total;
}

function toYearSeries(series: InseeSeries, yearMin: number): YearSeries | null {
  if (series.length === 0) return null;
  return { start: yearMin + series[0]!, counts: series.slice(1) };
}

const lastYearOf = (series: YearSeries) => series.start + series.counts.length - 1;

/** Transforme le fichier compact en enregistrements de source, avec les faits calculés. */
export function toRecords(data: InseeData): SourceRecord[] {
  const { yearMin, yearMax } = data.meta;
  yearRange.min = yearMin;
  yearRange.max = yearMax;
  return data.names.map(([label, total, male, female, maleSeries, femaleSeries]) => {
    const byYear = {
      male: toYearSeries(maleSeries, yearMin),
      female: toYearSeries(femaleSeries, yearMin),
    };
    const present = [byYear.male, byYear.female].filter((series) => series !== null);
    const firstYear = Math.min(...present.map((series) => series.start));
    const lastYear = Math.max(...present.map(lastYearOf));

    let peakYear = firstYear;
    let peakCount = 0;
    for (let year = firstYear; year <= lastYear; year++) {
      const count = countAt(byYear.male, year) + countAt(byYear.female, year);
      if (count > peakCount) {
        peakCount = count;
        peakYear = year;
      }
    }

    const facts: InseeFacts = {
      total,
      male,
      female,
      byYear,
      firstYear,
      lastYear,
      peakYear,
      peakCount,
      recent: 0,
      previous: 0,
    };
    facts.recent = birthsBetween(facts, yearMax - TREND_WINDOW + 1, yearMax);
    facts.previous = birthsBetween(facts, yearMax - 2 * TREND_WINDOW + 1, yearMax - TREND_WINDOW);
    return { label, facts };
  });
}
