import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { NameEntry, SearchMode } from '@/core';
import { durations, easings } from '@/ui/tokens';
import { ResultRow, ROW_HEIGHT } from './ResultRow';

interface Props {
  results: readonly NameEntry[];
  search: string;
  mode: SearchMode;
  /** Bloc situé au-dessus de la liste : quand sa hauteur change, la liste se décale. */
  aboveRef: RefObject<HTMLElement | null>;
}

/** Au-delà de ce nombre de lignes affichées, les animations de liste sont coupées. */
export const MAX_ANIMATED_ROWS = 200;
/** Apparition échelonnée du premier affichage : 10 lignes × 15 ms + 150 ms = 300 ms au plus. */
const STAGGER_ROWS = 10;
const STAGGER_STEP = 0.015;

/** Position d'un élément dans la page, sans tenir compte des transformations en cours. */
function pageOffsetTop(element: HTMLElement | null): number {
  let top = 0;
  for (let node = element; node; node = node.offsetParent as HTMLElement | null) {
    top += node.offsetTop;
  }
  return top;
}

/** Sortie d'une ligne : fondu si les résultats ont changé, immédiate si elle sort par défilement. */
const rowVariants = {
  exit: (animated: boolean) => ({
    opacity: 0,
    transition: { duration: animated ? durations.fast : 0 },
  }),
};

/**
 * Liste des résultats, virtualisée sur le défilement de la page.
 *
 * Seules les lignes affichées (une trentaine) existent et sont animées. Quand les résultats
 * changent, une ligne qui reste visible glisse vers sa nouvelle place, une nouvelle entre en
 * fondu, une ancienne s'efface. Le défilement, lui, ne déclenche aucune animation.
 */
export function ResultList({ results, search, mode, aboveRef }: Props) {
  const listRef = useRef<HTMLUListElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  // Génération des résultats : augmente à chaque nouvelle liste.
  const [tracked, setTracked] = useState({ results, generation: 0 });
  if (tracked.results !== results) {
    setTracked({ results, generation: tracked.generation + 1 });
  }
  const generation = tracked.generation;
  // Génération déjà affichée : tant qu'elle diffère, les lignes qui apparaissent ou
  // disparaissent le font à cause d'un changement de résultats.
  const [settled, setSettled] = useState(-1);
  useEffect(() => setSettled(generation), [generation]);
  const firstDisplay = settled === -1;
  const resultsChanged = settled !== generation;

  // Position de la liste dans la page. Elle ne change que si ce qui la précède change de
  // hauteur (pastilles qui passent à la ligne, en-tête) : on ne la mesure qu'à ce moment-là,
  // car lire une position force le navigateur à recalculer la mise en page.
  useLayoutEffect(() => {
    const measure = () => {
      const top = pageOffsetTop(listRef.current);
      setScrollMargin((current) => (Math.abs(current - top) < 1 ? current : top));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    for (const element of [aboveRef.current, document.querySelector('header')]) {
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [aboveRef]);

  const virtualizer = useWindowVirtualizer({
    count: results.length,
    estimateSize: () => ROW_HEIGHT,
    overscan: 5,
    scrollMargin,
    initialRect: { width: 360, height: 800 },
  });
  const items = virtualizer.getVirtualItems();
  const animated = items.length <= MAX_ANIMATED_ROWS;

  return (
    <ul
      ref={listRef}
      aria-label="Résultats"
      className="relative"
      style={{ height: virtualizer.getTotalSize() }}
    >
      <AnimatePresence initial custom={animated && resultsChanged}>
        {items.map((item, position) => {
          const y = item.start - virtualizer.options.scrollMargin;
          const entering = animated && resultsChanged;
          const delay = firstDisplay ? Math.min(position, STAGGER_ROWS) * STAGGER_STEP : 0;
          return (
            <motion.li
              key={results[item.index]!.id}
              className="absolute inset-x-0 top-0"
              style={{ height: item.size }}
              variants={rowVariants}
              initial={entering ? { opacity: 0, y: firstDisplay ? y + 8 : y } : false}
              animate={{ opacity: 1, y }}
              exit="exit"
              transition={{
                y: { duration: animated ? durations.base : 0, ease: easings.soft, delay },
                opacity: { duration: durations.fast + 0.03, ease: easings.soft, delay },
              }}
            >
              <ResultRow
                entry={results[item.index]!}
                search={search}
                mode={mode}
                animateIn={entering}
              />
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
