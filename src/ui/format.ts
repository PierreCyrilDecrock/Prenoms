/** Entier avec séparateurs de milliers (« 1 234 567 »). */
export const formatInt = (value: number) => value.toLocaleString('fr-FR');

/** Pourcentage entier (« 55 % »). */
export const formatPercent = (share: number) =>
  share.toLocaleString('fr-FR', { style: 'percent', maximumFractionDigits: 0 });

/** « 1 prénom », « 2 prénoms ». */
export const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${formatInt(count)} ${count > 1 ? pluralForm : singular}`;
