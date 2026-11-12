/**
 * Format du fichier public/data/insee.json, partagé entre le script de build
 * (scripts/build-data.ts) et la source INSEE du navigateur.
 */

/** À incrémenter à chaque changement incompatible du format. */
export const INSEE_FORMAT_VERSION = 1;

/**
 * Série annuelle compacte d'un sexe : [décalage, n0, n1, …].
 * n0 est l'effectif de l'année `yearMin + décalage`, n1 celui de l'année suivante, etc.
 * Les années sans naissance connue valent 0. Tableau vide si le sexe n'a aucune naissance.
 */
export type InseeSeries = number[];

/** Une entrée par prénom : [forme d'affichage, total, garçons, filles, série garçons, série filles]. */
export type InseeNameRow = [
  label: string,
  total: number,
  male: number,
  female: number,
  maleSeries: InseeSeries,
  femaleSeries: InseeSeries,
];

export interface InseeExclusion {
  /** Nombre de lignes du CSV exclues. */
  rows: number;
  /** Naissances correspondantes. */
  births: number;
}

export interface InseeMeta {
  formatVersion: number;
  /** Date de génération (ISO 8601). */
  generatedAt: string;
  /** Nom du fichier CSV source. */
  sourceFile: string;
  yearMin: number;
  yearMax: number;
  /** Nombre de prénoms (entrées du tableau names). */
  nameCount: number;
  /** Somme des effectifs conservés. */
  totalBirths: number;
}

export interface InseeData {
  meta: InseeMeta;
  /** Triées par identifiant normalisé. */
  names: InseeNameRow[];
}

/** Rapport de génération, publié dans public/data/insee.report.json. */
export interface InseeReport {
  meta: InseeMeta;
  csv: { rows: number; births: number; distinctNames: number };
  excluded: {
    /** Lignes dont l'année de naissance est inconnue (XXXX). */
    unknownYear: InseeExclusion;
    /** Regroupement des prénoms rares (_PRENOMS_RARES). */
    rareNames: InseeExclusion;
    /** Lignes illisibles (colonnes manquantes, sexe ou effectif invalide). */
    invalid: InseeExclusion;
    /** Prénoms qui disparaissent car toutes leurs lignes sont exclues. */
    namesWithoutKnownYear: number;
  };
  /** Graphies fusionnées dans une autre entrée (ex. LEA et LÉA). */
  mergedVariants: number;
  /** Taille de insee.json, en octets. */
  size?: { raw: number; gzip: number };
}
