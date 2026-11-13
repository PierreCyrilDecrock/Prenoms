import { useWindowVirtualizer } from '@tanstack/react-virtual';
import { useLayoutEffect, useRef, useState } from 'react';
import type { NameEntry, SearchMode } from '@/core';
import { ResultRow, ROW_HEIGHT } from './ResultRow';

interface Props {
  results: readonly NameEntry[];
  search: string;
  mode: SearchMode;
}

/** Liste des résultats, virtualisée sur le défilement de la page. */
export function ResultList({ results, search, mode }: Props) {
  const listRef = useRef<HTMLUListElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);

  // Position de la liste dans la page : elle change quand les pastilles passent à la ligne,
  // d'où une mesure à chaque rendu (sans effet si la position n'a pas bougé).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const top = (listRef.current?.getBoundingClientRect().top ?? 0) + window.scrollY;
    setScrollMargin((current) => (Math.abs(current - top) < 1 ? current : top));
  });

  const virtualizer = useWindowVirtualizer({
    count: results.length,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
    scrollMargin,
    initialRect: { width: 360, height: 800 },
    getItemKey: (index) => results[index]!.id,
  });

  return (
    <ul
      ref={listRef}
      aria-label="Résultats"
      className="relative"
      style={{ height: virtualizer.getTotalSize() }}
    >
      {virtualizer.getVirtualItems().map((item) => (
        <li
          key={item.key}
          className="absolute inset-x-0 top-0"
          style={{
            height: item.size,
            transform: `translateY(${item.start - virtualizer.options.scrollMargin}px)`,
          }}
        >
          <ResultRow entry={results[item.index]!} search={search} mode={mode} />
        </li>
      ))}
    </ul>
  );
}
