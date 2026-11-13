import { AnimatePresence, motion } from 'motion/react';
import type { AnyFilter } from '@/core';
import { useQueryStore } from '@/state/queryStore';
import { haptic } from '@/state/settingsStore';
import { durations, easings } from '@/ui/tokens';

interface Props {
  active: { filter: AnyFilter; params: unknown }[];
  canReset: boolean;
}

const transition = { duration: durations.base, ease: easings.soft };

/** Pastilles des filtres actifs, supprimables, et bouton « Tout réinitialiser ». */
export function ActiveChips({ active, canReset }: Props) {
  const clearFilter = useQueryStore((state) => state.clearFilter);
  const resetAll = useQueryStore((state) => state.resetAll);

  return (
    <div className={`flex flex-wrap items-center gap-2 px-4 ${canReset ? 'py-2' : ''}`}>
      {active.length > 0 && <span className="sr-only">Filtres actifs :</span>}
      <ul aria-label="Filtres actifs" className="contents">
        <AnimatePresence initial={false}>
          {active.map(({ filter, params }) => {
            const detail = filter.describe?.(params) ?? filter.toUrl(params);
            const text = detail ? `${filter.label} : ${detail}` : filter.label;
            return (
              <motion.li
                key={filter.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={transition}
              >
                <button
                  type="button"
                  onClick={() => {
                    clearFilter(filter.id);
                    haptic();
                  }}
                  aria-label={`Retirer le filtre ${text}`}
                  className="pressable inline-flex min-h-11 items-center gap-2 rounded-full border border-accent bg-accent-soft pr-3 pl-4 text-sm"
                >
                  {text}
                  <span aria-hidden="true" className="text-lg leading-none">
                    ×
                  </span>
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {canReset && (
        <button
          type="button"
          onClick={() => {
            resetAll();
            haptic();
          }}
          className="inline-flex min-h-11 items-center px-2 text-sm text-accent underline"
        >
          Tout réinitialiser
        </button>
      )}
    </div>
  );
}
