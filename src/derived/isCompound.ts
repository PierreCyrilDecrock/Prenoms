import type { DerivedField } from '@/core';

/** Prénom composé : contient un tiret ou un espace. */
const isCompound: DerivedField<boolean> = {
  id: 'isCompound',
  compute: (entry) => /[- ]/.test(entry.id),
};

export default isCompound;
