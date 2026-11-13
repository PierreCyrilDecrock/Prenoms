import type { Sort } from '@/core';
import { getInseeFacts, INSEE_SOURCE_ID } from '@/sources/insee/facts';

/** Naissances sur les 10 dernières années de la source. */
const recentPopularity: Sort = {
  id: 'recentPopularity',
  label: 'Popularité récente',
  requires: [INSEE_SOURCE_ID],
  compare: (a, b) => (getInseeFacts(a)?.recent ?? 0) - (getInseeFacts(b)?.recent ?? 0),
};

export default recentPopularity;
