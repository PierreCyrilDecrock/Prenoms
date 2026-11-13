import { normalizeName } from '../../src/core/normalizeName.ts';
import {
  INSEE_FORMAT_VERSION,
  type InseeData,
  type InseeNameRow,
  type InseeReport,
  type InseeSeries,
} from '../../src/sources/insee/format.ts';

export const UNKNOWN_YEAR = 'XXXX';
export const RARE_NAMES = '_PRENOMS_RARES';
/**
 * Colonnes reconnues, par rôle. L'édition 2024 nomme ses colonnes sexe;preusuel;annais;nombre ;
 * l'édition 2026 sexe;prenom;periode;valeur;rang. Les colonnes en plus (rang) sont ignorées.
 */
const COLUMNS = {
  sex: ['sexe'],
  name: ['preusuel', 'prenom'],
  year: ['annais', 'periode'],
  count: ['nombre', 'valeur'],
} as const;

export interface CsvRow {
  /** 1 = garçons, 2 = filles. */
  sex: 1 | 2;
  /** Prénom tel qu'écrit dans le fichier (majuscules). */
  name: string;
  /** Année de naissance, ou "XXXX". */
  year: string;
  count: number;
}

export interface ParsedCsv {
  rows: CsvRow[];
  /** Lignes illisibles, avec leur numéro (1 = en-tête). */
  invalid: { line: number; text: string }[];
}

/** Lit le CSV de l'INSEE : UTF-8, séparateur « ; », colonnes repérées par leur nom. */
export function parseInseeCsv(text: string): ParsedCsv {
  const lines = (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text).split(/\r?\n/);
  const header = (lines[0] ?? '').split(';').map((column) => column.trim().toLowerCase());
  const index = Object.fromEntries(
    Object.entries(COLUMNS).map(([role, names]) => [
      role,
      header.findIndex((column) => (names as readonly string[]).includes(column)),
    ]),
  ) as Record<keyof typeof COLUMNS, number>;
  if (Object.values(index).some((position) => position < 0)) {
    throw new Error(
      `En-tête inattendu : « ${lines[0]} » (colonnes attendues : sexe, preusuel ou prenom, ` +
        'annais ou periode, nombre ou valeur).',
    );
  }
  const rows: CsvRow[] = [];
  const invalid: ParsedCsv['invalid'] = [];
  for (let i = 1; i < lines.length; i++) {
    const text = lines[i]!;
    if (text.trim() === '') continue;
    const cols = text.split(';').map((col) => col.trim());
    const [sex, name, year, count] = [index.sex, index.name, index.year, index.count].map(
      (position) => cols[position],
    );
    const validYear = year === UNKNOWN_YEAR || /^\d{4}$/.test(year ?? '');
    if (
      cols.length !== header.length ||
      (sex !== '1' && sex !== '2') ||
      !name ||
      !validYear ||
      !/^\d+$/.test(count ?? '')
    ) {
      invalid.push({ line: i + 1, text });
      continue;
    }
    rows.push({ sex: sex === '1' ? 1 : 2, name, year: year!, count: Number(count) });
  }
  return { rows, invalid };
}

/**
 * Forme d'affichage d'un prénom en majuscules : « JEAN-BAPTISTE » donne « Jean-Baptiste ».
 * Après une apostrophe, la majuscule n'est mise que si le préfixe fait une lettre
 * (« N'Golo », « O'Brian », mais « Manec'h »).
 */
export function toDisplayLabel(raw: string): string {
  const capitalize = (word: string) =>
    word.charAt(0).toLocaleUpperCase('fr') + word.slice(1).toLocaleLowerCase('fr');
  return raw
    .trim()
    .split(/([- ])/)
    .map((part) => {
      const apostrophe = part.indexOf("'");
      if (apostrophe === 1) {
        return capitalize(part.slice(0, 2)) + capitalize(part.slice(2));
      }
      return capitalize(part);
    })
    .join('');
}

/** Série dense entre la première et la dernière année connue : [décalage, n0, n1, …]. */
export function toSeries(byYear: Map<number, number>, yearMin: number): InseeSeries {
  if (byYear.size === 0) return [];
  const years = [...byYear.keys()];
  const first = Math.min(...years);
  const last = Math.max(...years);
  const series: InseeSeries = [first - yearMin];
  for (let year = first; year <= last; year++) series.push(byYear.get(year) ?? 0);
  return series;
}

interface Accumulator {
  /** Effectif par graphie d'origine, pour choisir la forme d'affichage. */
  variants: Map<string, number>;
  male: Map<number, number>;
  female: Map<number, number>;
}

const sum = (values: Iterable<number>) => {
  let total = 0;
  for (const value of values) total += value;
  return total;
};

/** Transforme le CSV de l'INSEE en données compactes, avec le rapport des exclusions. */
export function buildInseeData(
  csvText: string,
  options: { sourceFile: string; generatedAt: string },
): { data: InseeData; report: InseeReport } {
  const { rows, invalid } = parseInseeCsv(csvText);

  const unknownYear = { rows: 0, births: 0 };
  const rareNames = { rows: 0, births: 0 };
  const allNames = new Set<string>();
  const keptNames = new Set<string>();
  const byId = new Map<string, Accumulator>();
  let yearMin = Infinity;
  let yearMax = -Infinity;

  for (const row of rows) {
    if (row.name === RARE_NAMES) {
      rareNames.rows++;
      rareNames.births += row.count;
      continue;
    }
    allNames.add(row.name);
    if (row.year === UNKNOWN_YEAR) {
      unknownYear.rows++;
      unknownYear.births += row.count;
      continue;
    }
    keptNames.add(row.name);
    const year = Number(row.year);
    yearMin = Math.min(yearMin, year);
    yearMax = Math.max(yearMax, year);

    const id = normalizeName(row.name);
    let acc = byId.get(id);
    if (!acc) {
      acc = { variants: new Map(), male: new Map(), female: new Map() };
      byId.set(id, acc);
    }
    acc.variants.set(row.name, (acc.variants.get(row.name) ?? 0) + row.count);
    const series = row.sex === 1 ? acc.male : acc.female;
    series.set(year, (series.get(year) ?? 0) + row.count);
  }

  if (byId.size === 0) throw new Error('Aucune ligne exploitable dans le CSV.');

  const names: InseeNameRow[] = [...byId.entries()]
    .map(([id, acc]) => {
      // Graphie la plus fréquente ; à égalité, la première dans l'ordre alphabétique.
      const [variant] = [...acc.variants.entries()].sort(
        ([nameA, countA], [nameB, countB]) => countB - countA || (nameA < nameB ? -1 : 1),
      )[0]!;
      const male = sum(acc.male.values());
      const female = sum(acc.female.values());
      const row: InseeNameRow = [
        toDisplayLabel(variant),
        male + female,
        male,
        female,
        toSeries(acc.male, yearMin),
        toSeries(acc.female, yearMin),
      ];
      return { id, row };
    })
    // Du plus donné au moins donné, puis par identifiant : c'est l'ordre d'affichage par
    // défaut, que le navigateur n'a donc pas à recalculer au chargement.
    .sort((a, b) => b.row[1] - a.row[1] || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((item) => item.row);

  const meta = {
    formatVersion: INSEE_FORMAT_VERSION,
    generatedAt: options.generatedAt,
    sourceFile: options.sourceFile,
    yearMin,
    yearMax,
    nameCount: names.length,
    totalBirths: sum(names.map((name) => name[1])),
  };

  const report: InseeReport = {
    meta,
    csv: {
      rows: rows.length + invalid.length,
      births: sum(rows.map((row) => row.count)),
      distinctNames: allNames.size,
    },
    excluded: {
      unknownYear,
      rareNames,
      invalid: { rows: invalid.length, births: 0 },
      namesWithoutKnownYear: allNames.size - keptNames.size,
    },
    mergedVariants: keptNames.size - names.length,
    // Édition 2026 : effectifs arrondis au multiple de 5 le plus proche.
    countsRoundedTo: rows.length > 0 && rows.every((row) => row.count % 5 === 0) ? 5 : null,
  };

  return { data: { meta, names }, report };
}

/** Somme des effectifs d'une série compacte. */
export function seriesTotal(series: InseeSeries): number {
  return sum(series.slice(1));
}

/**
 * Vérifie la cohérence entre le CSV et le JSON généré. Renvoie la liste des écarts (vide si tout va bien).
 * Le CSV est relu indépendamment de buildInseeData : seules les règles d'exclusion sont partagées.
 */
export function validateInseeData(csvText: string, data: InseeData): string[] {
  const errors: string[] = [];
  const { rows } = parseInseeCsv(csvText);
  let csvTotal = 0;
  let csvKept = 0;
  let csvMale = 0;
  for (const row of rows) {
    csvTotal += row.count;
    if (row.name === RARE_NAMES || row.year === UNKNOWN_YEAR) continue;
    csvKept += row.count;
    if (row.sex === 1) csvMale += row.count;
  }

  let jsonTotal = 0;
  let jsonMale = 0;
  let jsonFemale = 0;
  let jsonSeries = 0;
  for (const [label, total, male, female, maleSeries, femaleSeries] of data.names) {
    jsonTotal += total;
    jsonMale += male;
    jsonFemale += female;
    jsonSeries += seriesTotal(maleSeries) + seriesTotal(femaleSeries);
    if (total !== male + female) errors.push(`${label} : total ≠ garçons + filles.`);
    if (male !== seriesTotal(maleSeries))
      errors.push(`${label} : série garçons ≠ effectif garçons.`);
    if (female !== seriesTotal(femaleSeries))
      errors.push(`${label} : série filles ≠ effectif filles.`);
  }

  const check = (label: string, actual: number, expected: number) => {
    if (actual !== expected) errors.push(`${label} : ${actual} dans le JSON, ${expected} attendu.`);
  };
  check('Somme des totaux', jsonTotal, csvKept);
  check('Somme des séries', jsonSeries, csvKept);
  check('Somme garçons', jsonMale, csvMale);
  check('Somme filles', jsonFemale, csvKept - csvMale);
  check('meta.totalBirths', data.meta.totalBirths, csvKept);
  check('meta.nameCount', data.meta.nameCount, data.names.length);
  if (csvKept > csvTotal) errors.push('Plus de naissances conservées que dans le CSV.');
  return errors;
}
