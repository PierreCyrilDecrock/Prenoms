import type { Sort } from '@/core';
import { getInseeFacts, INSEE_SOURCE_ID } from '@/sources/insee/facts';

/** Naissances cumulées sur toute la période. */
const totalPopularity: Sort = {
  id: 'totalPopularity',
  label: 'Popularité totale',
  requires: [INSEE_SOURCE_ID],
  compare: (a, b) => (getInseeFacts(a)?.total ?? 0) - (getInseeFacts(b)?.total ?? 0),
};

export default totalPopularity;
