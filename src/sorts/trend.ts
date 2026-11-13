import type { NameEntry, Sort } from '@/core';
import { getInseeFacts, INSEE_SOURCE_ID } from '@/sources/insee/facts';

/** Variation en nombre de naissances : 10 dernières années moins les 10 précédentes. */
function variation(entry: NameEntry): number {
  const facts = getInseeFacts(entry);
  return facts ? facts.recent - facts.previous : 0;
}

/** Tendance : des plus fortes baisses aux plus fortes hausses. */
const trend: Sort = {
  id: 'trend',
  label: 'Tendance',
  requires: [INSEE_SOURCE_ID],
  compare: (a, b) => variation(a) - variation(b),
};

export default trend;
