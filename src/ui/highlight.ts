import { normalizeName, type SearchMode } from '@/core';

/**
 * Position, dans la forme affichée, du texte recherché (insensible à la casse et aux accents).
 * Renvoie [début, fin[ ou null si le texte ne s'y trouve pas selon le mode.
 */
export function highlightRange(
  label: string,
  search: string,
  mode: SearchMode,
): [number, number] | null {
  const needle = normalizeName(search);
  if (needle === '') return null;

  // Forme normalisée du libellé, avec pour chaque caractère sa position d'origine.
  let flat = '';
  const origin: number[] = [];
  for (let index = 0; index < label.length; index++) {
    const char = label[index]!;
    const piece = char === ' ' ? ' ' : normalizeName(char);
    for (const normalizedChar of piece) {
      flat += normalizedChar;
      origin.push(index);
    }
  }

  let start: number;
  if (mode === 'contains') start = flat.indexOf(needle);
  else if (mode === 'endsWith') start = flat.endsWith(needle) ? flat.length - needle.length : -1;
  else start = flat.startsWith(needle) ? 0 : -1;
  if (start < 0) return null;

  return [origin[start]!, origin[start + needle.length - 1]! + 1];
}
