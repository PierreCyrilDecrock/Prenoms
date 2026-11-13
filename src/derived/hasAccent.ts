import type { DerivedField } from '@/core';

const COMBINING_MARKS = /[̀-ͯ]/;

/** La forme d'affichage porte au moins un accent, un tréma ou une cédille. */
const hasAccent: DerivedField<boolean> = {
  id: 'hasAccent',
  compute: (entry) => COMBINING_MARKS.test(entry.label.normalize('NFD')),
};

export default hasAccent;
