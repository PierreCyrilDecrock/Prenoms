import type { DerivedField } from '@/core';

/** Initiale en majuscule, sans accent (« Élodie » donne « E »). */
const initial: DerivedField<string> = {
  id: 'initial',
  compute: (entry) => entry.id.charAt(0).toUpperCase(),
};

export default initial;
