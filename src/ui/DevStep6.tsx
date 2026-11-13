import { useMemo, useState } from 'react';
import { filters, runQuery, sorts, type AnyFilter } from '@/core';
import { useNamesStore } from '@/state/namesStore';

const int = (value: number) => value.toLocaleString('fr-FR');
const MAX_SHOWN = 12;

/** Section « Étape 6 » de la page de diagnostic : chaque filtre, son contrôle et son effet. */
export function DevStep6() {
  const entries = useNamesStore((state) => state.entries);
  const loadedSources = useNamesStore((state) => state.loadedSources);
  const [params, setParams] = useState<Record<string, unknown>>({});

  // Un filtre dont une source requise n'est pas chargée est masqué.
  const available = filters
    .all()
    .filter((filter) => (filter.requires ?? []).every((id) => loadedSources.includes(id)));
  const groups = [...new Set(available.map((filter) => filter.group))];
  const valueOf = (filter: AnyFilter) => params[filter.id] ?? filter.defaultParams;

  const { combined, alone, elapsedMs } = useMemo(() => {
    const context = { filters, sorts, loadedSources };
    const start = performance.now();
    const combined = runQuery(entries, { filters: params }, context);
    const elapsedMs = performance.now() - start;
    const alone: Record<string, number> = {};
    for (const [id, value] of Object.entries(params)) {
      if (filters.get(id)?.isActive(value)) {
        alone[id] = runQuery(entries, { filters: { [id]: value } }, context).length;
      }
    }
    return { combined, alone, elapsedMs };
  }, [entries, loadedSources, params]);

  const activeCount = Object.keys(alone).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="sticky top-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-2 border-b border-line bg-surface-raised px-4 py-2 sm:-mx-6 sm:px-6">
        <p aria-live="polite" data-testid="filters-summary">
          <strong>{int(combined.length)}</strong> résultat{combined.length > 1 ? 's' : ''} sur{' '}
          {int(entries.length)} · {activeCount} filtre{activeCount > 1 ? 's' : ''} actif
          {activeCount > 1 ? 's' : ''} ·{' '}
          {elapsedMs.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ms
        </p>
        <button
          type="button"
          onClick={() => setParams({})}
          disabled={activeCount === 0}
          className="min-h-11 rounded-card border border-line px-4 font-medium transition-transform duration-fast ease-soft active:scale-[0.98] disabled:opacity-50"
        >
          Tout réinitialiser
        </button>
      </div>

      <p className="text-sm text-ink-muted" data-testid="filters-preview">
        {combined
          .slice(0, MAX_SHOWN)
          .map((entry) => entry.label)
          .join(', ')}
        {combined.length > MAX_SHOWN && '…'}
      </p>

      {groups.map((group) => (
        <section key={group} aria-label={`Groupe ${group}`} className="flex flex-col gap-2">
          <h3 className="font-medium">{group}</h3>
          {available
            .filter((filter) => filter.group === group)
            .map((filter) => {
              const value = valueOf(filter);
              const active = filter.isActive(value);
              return (
                <div
                  key={filter.id}
                  data-testid={`filter-${filter.id}`}
                  className={`flex flex-col gap-2 rounded-card border p-3 ${
                    active ? 'border-accent' : 'border-line'
                  }`}
                >
                  <p className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium">
                      {filter.label} <code className="text-xs text-ink-muted">{filter.id}</code>
                    </span>
                    {active && (
                      <span className="text-sm" data-testid={`filter-count-${filter.id}`}>
                        seul : <strong>{int(alone[filter.id] ?? 0)}</strong> · URL{' '}
                        <code className="rounded bg-accent-soft px-1">{filter.toUrl(value)}</code>
                      </span>
                    )}
                  </p>
                  <filter.Control
                    value={value}
                    onChange={(next: unknown) =>
                      setParams((current) => ({ ...current, [filter.id]: next }))
                    }
                  />
                </div>
              );
            })}
        </section>
      ))}
    </div>
  );
}
