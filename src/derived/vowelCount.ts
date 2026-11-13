import type { DerivedField } from '@/core';

/** Nombre de voyelles (a, e, i, o, u, y), accents ignorés. */
const vowelCount: DerivedField<number> = {
  id: 'vowelCount',
  compute: (entry) => entry.id.replace(/[^aeiouy]/g, '').length,
};

export default vowelCount;
