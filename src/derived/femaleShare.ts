import type { DerivedField, NameEntry } from '@/core';
import { getInseeFacts, INSEE_SOURCE_ID } from '@/sources/insee/facts';

/** Part des naissances féminines, entre 0 et 1. */
export function computeFemaleShare(entry: NameEntry): number {
  const facts = getInseeFacts(entry);
  return facts && facts.total > 0 ? facts.female / facts.total : 0;
}

const femaleShare: DerivedField<number> = {
  id: 'femaleShare',
  requires: [INSEE_SOURCE_ID],
  compute: computeFemaleShare,
};

export default femaleShare;
