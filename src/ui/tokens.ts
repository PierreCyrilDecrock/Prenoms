/**
 * Jetons de mouvement partagés avec Motion (en secondes).
 * Mêmes valeurs que les variables CSS de src/index.css.
 */
export const durations = { fast: 0.12, base: 0.18, slow: 0.25, page: 0.35 } as const;

export const easings = {
  soft: [0.22, 1, 0.36, 1],
  inOutSoft: [0.45, 0, 0.25, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

/** Jetons de couleur affichés sur la page de diagnostic. */
export const colorTokens = [
  { name: 'surface', label: 'Surface' },
  { name: 'surface-raised', label: 'Surface élevée' },
  { name: 'surface-sunken', label: 'Surface creuse' },
  { name: 'ink', label: 'Texte' },
  { name: 'ink-muted', label: 'Texte secondaire' },
  { name: 'line', label: 'Bordure' },
  { name: 'accent', label: 'Accent' },
  { name: 'accent-soft', label: 'Accent doux' },
  { name: 'female', label: 'Filles' },
  { name: 'male', label: 'Garçons' },
  { name: 'success', label: 'Succès' },
  { name: 'warning', label: 'Alerte' },
  { name: 'danger', label: 'Erreur' },
] as const;
