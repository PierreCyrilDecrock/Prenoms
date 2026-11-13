import { memo, useMemo } from 'react';
import type { NameEntry, SearchMode } from '@/core';
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
}

/** Une ligne de résultat : prénom en grand, répartition, mini-courbe et total. */
export const ResultRow = memo(function ResultRow({ entry, search, mode }: Props) {
  const stats = useMemo(() => getNameStats(entry), [entry]);
  const yearly = useMemo(() => stats?.yearly() ?? [], [stats]);

  return (
    <a
      href={nameHref(entry.id)}
      className="flex h-full items-center gap-3 border-b border-line px-4 hover:bg-surface-raised focus-visible:bg-surface-raised focus-visible:-outline-offset-2"
    >
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-xl leading-tight font-semibold">
          <Highlighted label={entry.label} search={search} mode={mode} />
        </span>
        {stats && <GenderBar femaleShare={stats.femaleShare} />}
      </span>
      {stats && <Sparkline values={yearly} />}
      {stats && (
        <span className="flex w-20 shrink-0 flex-col items-end leading-tight">
          <span className="font-medium">{formatInt(stats.total)}</span>
          <span className="text-xs text-ink-muted">naissances</span>
        </span>
      )}
    </a>
  );
});
