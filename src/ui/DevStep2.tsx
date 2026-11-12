import { useState } from 'react';
import { derivedFields, filters, normalizeName, sorts, sources } from '@/core';

const registries = [
  { title: 'Sources', path: 'src/sources/<id>/index.ts', registry: sources },
  { title: 'Champs calculés', path: 'src/derived/<id>.ts', registry: derivedFields },
  { title: 'Filtres', path: 'src/filters/<id>.tsx', registry: filters },
  { title: 'Tris', path: 'src/sorts/<id>.ts', registry: sorts },
];

function describe(module: { id: string; label?: string; group?: string; requires?: string[] }) {
  return [
    module.label,
    module.group && `groupe : ${module.group}`,
    module.requires?.length && `requiert : ${module.requires.join(', ')}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

/** Section « Étape 2 » de la page de diagnostic : registres et normalizeName(). */
export function DevStep2() {
  const [name, setName] = useState('  Jean - Baptiste  ');
  const normalized = normalizeName(name);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2 font-medium">Registres (modules découverts automatiquement)</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {registries.map(({ title, path, registry }) => (
            <div
              key={title}
              data-testid={`registry-${registry.kind}`}
              className="rounded-card border border-line p-3"
            >
              <p className="font-medium">
                {title} <span className="text-ink-muted">({registry.all().length})</span>
              </p>
              <code className="text-xs text-ink-muted">{path}</code>
              <ul className="mt-2 flex flex-col gap-1 text-sm">
                {registry.all().map((module) => (
                  <li key={module.id}>
                    <code className="rounded bg-accent-soft px-1">{module.id}</code>{' '}
                    <span className="text-ink-muted">{describe(module)}</span>
                  </li>
                ))}
                {registry.all().length === 0 && <li className="text-ink-muted">Aucun module</li>}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 font-medium">normalizeName() en direct</h3>
        <label className="flex flex-col gap-1 text-sm">
          Prénom à normaliser
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="min-h-11 rounded-card border border-line bg-surface px-3 text-base"
          />
        </label>
        <p className="mt-2 text-sm text-ink-muted">Résultat (entre crochets) :</p>
        <output data-testid="normalized" className="block text-lg font-medium whitespace-pre-wrap">
          [{normalized}]
        </output>
      </div>
    </div>
  );
}
