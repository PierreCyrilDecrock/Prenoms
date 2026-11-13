import { memo, useMemo, useState } from 'react';
import type { NameEntry, SearchMode } from '@/core';
import { NAME_TRANSITION, useNavStore } from '@/state/navStore';
import { FavoriteButton } from '@/ui/FavoriteButton';
import { formatInt } from '@/ui/format';
import { highlightRange } from '@/ui/highlight';
import { getNameStats } from '@/ui/inseeView';
import { GenderBar } from './GenderBar';
import { Sparkline } from './Sparkline';

export const ROW_HEIGHT = 72;

/** Adresse de la fiche d'un prénom. */
export const nameHref = (id: string) => `#/prenom/${encodeURIComponent(id)}`;

/** Prénom avec le texte recherché surligné. */
export function Highlighted({
  label,
  search,
  mode,
}: {
  label: string;
  search: string;
  mode: SearchMode;
}) {
  const range = highlightRange(label, search, mode);
  if (!range) return <>{label}</>;
  return (
    <>
      {label.slice(0, range[0])}
      <mark className="rounded-sm bg-accent-soft text-inherit">
        {label.slice(range[0], range[1])}
      </mark>
      {label.slice(range[1])}
    </>
  );
}

interface Props {
  entry: NameEntry;
  search: string;
  mode: SearchMode;
  /** Vrai si la ligne apparaît à la suite d'un changement de résultats (et non d'un défilement). */
  animateIn: boolean;
}

/** Une ligne de résultat : prénom en grand, répartition, mini-courbe, total et favori. */
export const ResultRow = memo(function ResultRow({ entry, search, mode, animateIn }: Props) {
  const stats = useMemo(() => getNameStats(entry), [entry]);
  const yearly = useMemo(() => stats?.yearly() ?? [], [stats]);
  // Décidé une fois, à l'apparition de la ligne.
  const [drawIn] = useState(animateIn);
  const isLastOpened = useNavStore((state) => state.lastOpenedId === entry.id);
  const setLastOpened = useNavStore((state) => state.setLastOpened);

  return (
    <div className="flex h-full items-center border-b border-line pr-1 hover:bg-surface-raised">
      <a
        href={nameHref(entry.id)}
        onClick={() => setLastOpened(entry.id)}
        className="flex h-full min-w-0 flex-1 items-center gap-2 pl-4 transition-transform duration-fast ease-soft focus-visible:-outline-offset-2 active:scale-[0.98] sm:gap-3"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="truncate text-xl leading-tight font-semibold">
            <span style={isLastOpened ? { viewTransitionName: NAME_TRANSITION } : undefined}>
              <Highlighted label={entry.label} search={search} mode={mode} />
            </span>
          </span>
          {stats && <GenderBar femaleShare={stats.femaleShare} animateIn={drawIn} />}
        </span>
        {stats && <Sparkline values={yearly} animateIn={drawIn} />}
        {stats && (
          <span className="flex shrink-0 flex-col items-end leading-tight">
            <span className="font-medium">{formatInt(stats.total)}</span>
            <span className="text-xs text-ink-muted">naissances</span>
          </span>
        )}
      </a>
      <FavoriteButton id={entry.id} label={entry.label} />
    </div>
  );
});
