import type { DerivedField } from '@/core';

/** Nombre de lettres du prénom (tirets, espaces et apostrophes non comptés). */
const length: DerivedField<number> = {
  id: 'length',
  compute: (entry) => entry.id.replace(/[^a-z]/g, '').length,
};

export default length;
