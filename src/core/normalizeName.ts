const DASHES = /[‐-―−]/g;
const APOSTROPHES = /[‘’ʼ`´]/g;
const COMBINING_MARKS = /[̀-ͯ]/g;

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
  return name
    .toLowerCase()
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
