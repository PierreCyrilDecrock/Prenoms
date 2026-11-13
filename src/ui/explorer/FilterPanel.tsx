import { filters, type AnyFilter } from '@/core';
import { useNamesStore } from '@/state/namesStore';
import { useQueryStore } from '@/state/queryStore';

/** Panneau de filtres, généré depuis le registre et groupé par `group`. */
export function FilterPanel() {
  const loadedSources = useNamesStore((state) => state.loadedSources);
  const filterParams = useQueryStore((state) => state.filterParams);
  const setFilter = useQueryStore((state) => state.setFilter);
  const clearFilter = useQueryStore((state) => state.clearFilter);

  // Un filtre dont une source requise n'est pas chargée est masqué.
  const available = filters
    .all()
    .filter((filter) => (filter.requires ?? []).every((id) => loadedSources.includes(id)));
  const groups = [...new Set(available.map((filter) => filter.group))];
  const valueOf = (filter: AnyFilter) => filterParams[filter.id] ?? filter.defaultParams;

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group} aria-labelledby={`group-${group}`} className="flex flex-col gap-4">
          <h3
            id={`group-${group}`}
            className="text-sm font-semibold tracking-wide text-ink-muted uppercase"
          >
            {group}
          </h3>
          {available
            .filter((filter) => filter.group === group)
            .map((filter) => {
              const value = valueOf(filter);
              const active = filter.isActive(value);
              return (
                <div
                  key={filter.id}
                  role="group"
                  aria-label={filter.label}
                  className="flex flex-col gap-2"
                >
                  <div className="flex min-h-8 items-center justify-between gap-2">
                    <h4 className="font-medium">
                      {filter.label}
                      {active && (
                        <span className="ml-2 inline-block size-2 rounded-full bg-accent align-middle">
                          <span className="sr-only"> (actif)</span>
                        </span>
                      )}
                    </h4>
                    {active && (
                      <button
                        type="button"
                        onClick={() => clearFilter(filter.id)}
                        aria-label={`Effacer le filtre ${filter.label}`}
                        className="-my-1.5 inline-flex min-h-11 items-center px-2 text-sm text-accent underline"
                      >
                        Effacer
                      </button>
                    )}
                  </div>
                  <filter.Control
                    value={value}
                    onChange={(next: unknown) => setFilter(filter.id, next)}
                  />
                </div>
              );
            })}
        </section>
      ))}
    </div>
  );
}
