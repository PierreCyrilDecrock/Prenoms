import { sorts } from '@/core';
import { useNamesStore } from '@/state/namesStore';
import { useQueryStore } from '@/state/queryStore';
import { haptic } from '@/state/settingsStore';
import { buttonClass } from './States';

/** Sélecteur de tri et de sens, alimenté par le registre. */
export function SortControls() {
  const loadedSources = useNamesStore((state) => state.loadedSources);
  const sortId = useQueryStore((state) => state.sortId);
  const direction = useQueryStore((state) => state.direction);
  const setSort = useQueryStore((state) => state.setSort);
  const setDirection = useQueryStore((state) => state.setDirection);

  // Un tri dont une source requise n'est pas chargée est masqué.
  const available = sorts
    .all()
    .filter((sort) => (sort.requires ?? []).every((id) => loadedSources.includes(id)));
  const descending = direction === 'desc';

  return (
    <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
      <label htmlFor="sort" className="sr-only text-sm text-ink-muted sm:not-sr-only">
        Trier par
      </label>
      <select
        id="sort"
        value={available.some((sort) => sort.id === sortId) ? sortId : ''}
        onChange={(event) => setSort(event.target.value)}
        className="min-h-11 min-w-0 flex-1 rounded-card border border-line bg-surface-raised px-3 sm:flex-none"
      >
        {!available.some((sort) => sort.id === sortId) && <option value="">Ordre d’origine</option>}
        {available.map((sort) => (
          <option key={sort.id} value={sort.id}>
            {sort.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => {
          setDirection(descending ? 'asc' : 'desc');
          haptic();
        }}
        aria-label={`Sens du tri : ${descending ? 'décroissant' : 'croissant'}. Inverser`}
        className={buttonClass}
      >
        <span aria-hidden="true">{descending ? '↓' : '↑'}</span>
        <span className="hidden sm:inline">{descending ? 'Décroissant' : 'Croissant'}</span>
      </button>
    </div>
  );
}
