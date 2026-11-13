import type { Sort } from '@/core';

/** Ordre alphabétique, sans tenir compte des accents ni de la casse. */
const alphabetical: Sort = {
  id: 'alphabetical',
  label: 'Alphabétique',
  compare: (a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
};

export default alphabetical;
