import type { AnyFilter } from './filter';
import { createRegistry } from './registry';
import type { DataSource, DerivedField, Sort } from './types';

/*
 * Découverte automatique des modules : ajouter un fichier dans l'un de ces dossiers suffit.
 * Les motifs doivent rester des chaînes littérales (contrainte de import.meta.glob).
 */

export const sources = createRegistry<DataSource>(
  'source',
  import.meta.glob('../sources/*/index.ts', { eager: true }),
);

export const derivedFields = createRegistry<DerivedField>(
  'champ calculé',
  import.meta.glob(['../derived/*.ts', '!../derived/*.test.ts'], { eager: true }),
);

export const filters = createRegistry<AnyFilter>(
  'filtre',
  import.meta.glob(['../filters/*.tsx', '!../filters/*.test.tsx'], { eager: true }),
);

export const sorts = createRegistry<Sort>(
  'tri',
  import.meta.glob(['../sorts/*.ts', '!../sorts/*.test.ts'], { eager: true }),
);
