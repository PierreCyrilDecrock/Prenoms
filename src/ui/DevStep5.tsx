import { useMemo, useState } from 'react';
import { filters, runQuery, sorts, type SearchMode } from '@/core';
import { useNamesStore } from '@/state/namesStore';

const modes: { id: SearchMode; label: string }[] = [
  { id: 'startsWith', label: 'Commence par' },
  { id: 'contains', label: 'Contient' },
  { id: 'endsWith', label: 'Finit par' },
];
const MAX_SHOWN = 20;
const int = (value: number) => value.toLocaleString('fr-FR');

/** Section « Étape 5 » de la page de diagnostic : recherche brute et temps de réponse. */
export function DevStep5() {
  const entries = useNamesStore((state) => state.entries);
  const loadedSources = useNamesStore((state) => state.loadedSources);
  const [text, setText] = useState('');
  const [mode, setMode] = useState<SearchMode>('startsWith');

  const { result, elapsedMs } = useMemo(() => {
    const start = performance.now();
    const result = runQuery(entries, { search: { text, mode } }, { filters, sorts, loadedSources });
    return { result, elapsedMs: performance.now() - start };
  }, [entries, loadedSources, text, mode]);

  return (
    <div className="flex flex-col gap-4" data-testid="raw-search">
      <label className="flex flex-col gap-1 text-sm">
        Recherche brute
        <input
          type="search"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="lea, Léa, LÉA…"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="min-h-11 rounded-card border border-line bg-surface px-3 text-base"
        />
      </label>

      <fieldset className="flex flex-wrap gap-2">
        <legend className="mb-1 text-sm">Mode de recherche</legend>
        {modes.map((item) => (
          <label
            key={item.id}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-card border border-line px-3 has-checked:border-accent has-checked:bg-accent-soft"
          >
            <input
              type="radio"
              name="dev-search-mode"
              checked={mode === item.id}
              onChange={() => setMode(item.id)}
              className="accent-accent"
            />
            {item.label}
          </label>
        ))}
      </fieldset>

      <p aria-live="polite" data-testid="query-summary">
        <strong>{int(result.length)}</strong> résultat{result.length > 1 ? 's' : ''} sur{' '}
        {int(entries.length)} en{' '}
        <strong>{elapsedMs.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ms</strong>
      </p>

      <ol className="flex flex-wrap gap-2" data-testid="query-results">
        {result.slice(0, MAX_SHOWN).map((entry) => (
          <li key={entry.id} className="rounded-card border border-line px-3 py-1">
            {entry.label}
          </li>
        ))}
      </ol>
      {result.length > MAX_SHOWN && (
        <p className="text-sm text-ink-muted">
          … et {int(result.length - MAX_SHOWN)} autres (les {MAX_SHOWN} premiers sont affichés).
        </p>
      )}
    </div>
  );
}
