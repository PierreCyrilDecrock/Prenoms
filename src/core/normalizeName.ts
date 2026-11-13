const DASHES = /[\u2010-\u2015\u2212]/g;
const APOSTROPHES = /[\u2018\u2019\u02BC`\u00B4]/g;
const COMBINING_MARKS = /[\u0300-\u036f]/g;
const SIMPLE = /^[a-z]+$/;

/**
 * Forme normalisée d'un prénom, utilisée comme identifiant et clé de fusion entre sources.
 *
 * - minuscules, sans accents ni cédille ; « œ » et « æ » deviennent « oe » et « ae » ;
 * - tirets et apostrophes typographiques ramenés à « - » et « ' » (ils sont conservés :
 *   « Jean-Baptiste » et « Jean Baptiste » restent deux prénoms distincts) ;
 * - espaces de début et de fin supprimés, espaces multiples réduits à un seul,
 *   aucun espace autour d'un tiret ou d'une apostrophe.
 */
export function normalizeName(name: string): string {
  const lower = name.toLowerCase();
  // Cas le plus courant, traité sans les remplacements : uniquement des lettres sans accent.
  if (SIMPLE.test(lower)) return lower;
  return lower
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(DASHES, '-')
    .replace(APOSTROPHES, "'")
    .replace(/\s+/g, ' ')
    .replace(/ ?([-']) ?/g, '$1')
    .replace(/-{2,}/g, '-')
    .trim();
}
