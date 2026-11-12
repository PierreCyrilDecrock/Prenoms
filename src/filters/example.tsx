import type { Filter } from '@/core';

interface Params {
  startsWith: string;
}

/**
 * Filtre d'exemple FACTICE (étape 2) : l'id commence par un texte donné.
 * À retirer quand les vrais filtres arrivent (étape 6).
 */
const example: Filter<Params> = {
  id: 'example',
  label: 'Exemple (factice)',
  group: 'Exemple',
  defaultParams: { startsWith: '' },
  isActive: (params) => params.startsWith !== '',
  test: (entry, params) => entry.id.startsWith(params.startsWith),
  Control: ({ value, onChange }) => (
    <label className="flex flex-col gap-1 text-sm">
      Commence par
      <input
        type="text"
        value={value.startsWith}
        onChange={(event) => onChange({ startsWith: event.target.value })}
        className="min-h-11 rounded-card border border-line bg-surface px-3"
      />
    </label>
  ),
  toUrl: (params) => params.startsWith,
  fromUrl: (value) => ({ startsWith: value }),
};

export default example;
