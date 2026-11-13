import type { Sort } from '@/core';
import { DEMO_SOURCE_ID, getDemoFacts } from '@/sources/demo/facts';

/** Nombre de syllabes ; un prénom absent de la source démo compte 0. */
const demoSyllables: Sort = {
  id: 'demoSyllables',
  label: 'Syllabes (démo)',
  requires: [DEMO_SOURCE_ID],
  compare: (a, b) => (getDemoFacts(a)?.syllables ?? 0) - (getDemoFacts(b)?.syllables ?? 0),
};

export default demoSyllables;
