import type { Sort } from '@/core';

/**
 * Tri d'exemple FACTICE (étape 2) : ordre des identifiants.
 * À retirer quand les vrais tris arrivent (étape 7).
 */
const example: Sort = {
  id: 'example',
  label: 'Exemple (factice)',
  compare: (a, b) => a.id.localeCompare(b.id, 'fr'),
};

export default example;
