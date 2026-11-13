/** Aides de sérialisation partagées par les filtres (toUrl / fromUrl). */

export interface NumberRange {
  min: number | null;
  max: number | null;
}

export const EMPTY_RANGE: NumberRange = { min: null, max: null };

/** Entier positif ou nul, sinon null. */
export function parseInteger(value: string | undefined): number | null {
  if (value === undefined || !/^\d{1,9}$/.test(value)) return null;
  return Number(value);
}

/** « 3-6 », « 3- » ou « -6 » ; chaîne vide si l'intervalle est vide. */
export function formatRange(range: NumberRange): string {
  if (range.min === null && range.max === null) return '';
  return `${range.min ?? ''}-${range.max ?? ''}`;
}

/** Inverse de formatRange ; toute valeur invalide donne l'intervalle vide. */
export function parseRange(value: string): NumberRange {
  const match = /^(\d{0,9})-(\d{0,9})$/.exec(value);
  if (!match) return EMPTY_RANGE;
  return { min: parseInteger(match[1]), max: parseInteger(match[2]) };
}

export const isRangeActive = (range: NumberRange) => range.min !== null || range.max !== null;

export const inRange = (value: number, range: NumberRange) =>
  (range.min === null || value >= range.min) && (range.max === null || value <= range.max);

/** Valeur parmi une liste autorisée, sinon la valeur de repli. */
export function parseChoice<T extends string>(
  value: string,
  allowed: readonly T[],
  fallback: T,
): T {
  return (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}
