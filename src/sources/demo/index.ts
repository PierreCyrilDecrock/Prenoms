import type { DataSource } from '@/core';
import { DEMO_SOURCE_ID, type DemoFacts } from './facts';

/** Prénoms écrits en dur : [forme d'affichage, origine, syllabes]. */
const NAMES: [string, DemoFacts['origin'], number][] = [
  ['Marie', 'hébraïque', 2],
  ['Jean', 'hébraïque', 1],
  ['Léa', 'hébraïque', 2],
  ['Louis', 'germanique', 2],
  ['Emma', 'germanique', 2],
  ['Gabriel', 'hébraïque', 3],
  ['Chloé', 'grecque', 2],
  ['Hugo', 'germanique', 2],
  ['Inès', 'grecque', 2],
  ['Nathan', 'hébraïque', 2],
];

/** Source « demo » : une dizaine de prénoms avec une origine et un nombre de syllabes. */
const demo: DataSource = {
  id: DEMO_SOURCE_ID,
  label: 'Démo (données d’illustration)',
  async load(onProgress) {
    onProgress?.(1);
    return {
      records: NAMES.map(([label, origin, syllables]) => {
        const facts: DemoFacts = { origin, syllables };
        return { label, facts };
      }),
      meta: { count: NAMES.length },
    };
  },
};

export default demo;
