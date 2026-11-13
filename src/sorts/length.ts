import type { Sort } from '@/core';

/** Nombre de lettres du prénom. */
const length: Sort = {
  id: 'length',
  label: 'Longueur',
  compare: (a, b) => (a.derived.length as number) - (b.derived.length as number),
};

export default length;
