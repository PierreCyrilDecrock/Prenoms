import type { AnyFilter } from '@/core';
import { useQueryStore } from '@/state/queryStore';

interface Props {
  active: { filter: AnyFilter; params: unknown }[];
  canReset: boolean;
}

/** Pastilles des filtres actifs, supprimables, et bouton « Tout réinitialiser ». */
export function ActiveChips({ active, canReset }: Props) {
  const clearFilter = useQueryStore((state) => state.clearFilter);
  const resetAll = useQueryStore((state) => state.resetAll);
  if (!canReset) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2">
      <ul aria-label="Filtres actifs" className="contents">
        {active.map(({ filter, params }) => {
          const detail = filter.describe?.(params) ?? filter.toUrl(params);
          const text = detail ? `${filter.label} : ${detail}` : filter.label;
          return (
            <li key={filter.id}>
              <button
                type="button"
                onClick={() => clearFilter(filter.id)}
                aria-label={`Retirer le filtre ${text}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-accent bg-accent-soft pr-3 pl-4 text-sm transition-transform duration-fast ease-soft active:scale-[0.98]"
              >
                {text}
                <span aria-hidden="true" className="text-lg leading-none">
                  ×
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={resetAll}
        className="inline-flex min-h-11 items-center px-2 text-sm text-accent underline"
      >
        Tout réinitialiser
      </button>
    </div>
  );
}
