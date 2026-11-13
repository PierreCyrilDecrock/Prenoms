import type { Sort } from '@/core';
import { getInseeFacts, INSEE_SOURCE_ID } from '@/sources/insee/facts';

/** Année du pic de naissances. */
const peakYear: Sort = {
  id: 'peakYear',
  label: 'Année du pic',
  requires: [INSEE_SOURCE_ID],
  compare: (a, b) => (getInseeFacts(a)?.peakYear ?? 0) - (getInseeFacts(b)?.peakYear ?? 0),
};

export default peakYear;
