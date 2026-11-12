import type { DataSource } from '@/core';

/**
 * Source d'exemple FACTICE (étape 2) : prouve la découverte automatique des sources.
 * À retirer quand la vraie source INSEE arrive (étape 4).
 */
const example: DataSource = {
  id: 'example',
  label: 'Exemple (factice)',
  async load(onProgress) {
    onProgress?.(1);
    return {
      records: [
        { label: 'Léa', facts: { total: 3 } },
        { label: 'Noël', facts: { total: 2 } },
        { label: 'Jean-Baptiste', facts: { total: 1 } },
      ],
    };
  },
};

export default example;
