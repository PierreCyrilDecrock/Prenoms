/** Entier avec séparateurs de milliers (« 1 234 567 »). */
const integer = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });
const percent = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 0 });

export const formatInt = (value: number) => integer.format(value);

/** Pourcentage entier (« 55 % »). */
export const formatPercent = (share: number) => percent.format(share);

/** « 1 prénom », « 2 prénoms ». */
export const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${formatInt(count)} ${count > 1 ? pluralForm : singular}`;
