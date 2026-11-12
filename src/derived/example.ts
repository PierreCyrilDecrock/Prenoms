import type { DerivedField } from '@/core';

/**
 * Champ calculé d'exemple FACTICE (étape 2) : nombre de caractères de l'id.
 * À retirer quand les vrais champs calculés arrivent (étape 4).
 */
const example: DerivedField<number> = {
  id: 'example',
  compute: (entry) => entry.id.length,
};

export default example;
