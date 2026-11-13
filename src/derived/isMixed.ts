import type { DerivedField } from '@/core';
import { INSEE_SOURCE_ID } from '@/sources/insee/facts';
import { computeFemaleShare } from './femaleShare';

/** Part minimale de chaque sexe pour qu'un prénom soit considéré comme mixte. */
export const MIXED_MIN_SHARE = 0.2;

/** Prénom mixte : au moins 20 % de naissances de chaque sexe. */
const isMixed: DerivedField<boolean> = {
  id: 'isMixed',
  requires: [INSEE_SOURCE_ID],
  compute: (entry) => {
    const share = computeFemaleShare(entry);
    return share >= MIXED_MIN_SHARE && share <= 1 - MIXED_MIN_SHARE;
  },
};

export default isMixed;
