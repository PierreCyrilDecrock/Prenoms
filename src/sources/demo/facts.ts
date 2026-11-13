import type { NameEntry } from '@/core';

export const DEMO_SOURCE_ID = 'demo';

export const DEMO_ORIGINS = ['germanique', 'grecque', 'hébraïque'] as const;
export type DemoOrigin = (typeof DEMO_ORIGINS)[number];

/** Faits de la source démo pour un prénom, rangés sous facts.demo. */
export interface DemoFacts {
  /** Origine du prénom (valeur d'illustration). */
  origin: DemoOrigin;
  /** Nombre de syllabes à l'oral. */
  syllables: number;
}

/** Faits démo d'un prénom, ou undefined s'il ne vient pas de cette source. */
export function getDemoFacts(entry: NameEntry): DemoFacts | undefined {
  return entry.facts[DEMO_SOURCE_ID] as DemoFacts | undefined;
}
