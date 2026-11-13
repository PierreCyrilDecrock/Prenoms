import { sources } from '@/core';
import { useNamesStore } from '@/state/namesStore';

const int = (value: number) => value.toLocaleString('fr-FR');
const SAMPLE_SIZE = 10;

/** Affiche une valeur de façon compacte : les longs tableaux sont résumés. */
function compact(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.length > 8 ? `[${value.length} valeurs]` : value.map(compact);
  }
  if (typeof value === 'number' && !Number.isInteger(value)) return Number(value.toFixed(3));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, compact(item)]));
  }
  return value;
}

/** Section « Étape 4 » de la page de diagnostic : chargement, cache et échantillon. */
export function DevStep4() {
  const { status, entries, error, progress, sourceMeta, loadDurationMs } = useNamesStore();
  const load = useNamesStore((state) => state.load);
  const clearCachesAndReload = useNamesStore((state) => state.clearCachesAndReload);

  // Échantillon réparti sur toute la liste.
  const step = Math.max(1, Math.floor(entries.length / SAMPLE_SIZE));
  const sample = entries.filter((_, index) => index % step === 0).slice(0, SAMPLE_SIZE);
  const busy = status === 'loading';

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {sources.all().map((source) => {
          const value = progress[source.id] ?? 0;
          const meta = sourceMeta[source.id];
          return (
            <li key={source.id} className="flex flex-col gap-1">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <span className="font-medium">{source.label}</span>
                <span className="text-ink-muted">{Math.round(value * 100)} %</span>
              </div>
              <div
                role="progressbar"
                aria-label={`Chargement : ${source.label}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(value * 100)}
                className="h-3 overflow-hidden rounded-card bg-surface-sunken"
              >
                <div
                  className="h-full origin-left bg-accent transition-transform duration-fast ease-soft"
                  style={{ transform: `scaleX(${value})` }}
                />
              </div>
              {meta && (
                <p className="text-sm" data-testid={`origin-${source.id}`}>
                  Origine des données :{' '}
                  <strong>
                    {meta.fromCache ? 'cache local (IndexedDB)' : 'réseau (téléchargement)'}
                  </strong>
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <p aria-live="polite" data-testid="load-status">
        {status === 'idle' && 'En attente.'}
        {status === 'loading' && 'Chargement en cours…'}
        {status === 'ready' && (
          <>
            <strong>{int(entries.length)}</strong> prénoms chargés
            {loadDurationMs !== null && ` en ${int(Math.round(loadDurationMs))} ms`}.
          </>
        )}
        {status === 'error' && <span className="text-danger">Erreur : {error}</span>}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void load()}
          disabled={busy}
          className="min-h-11 rounded-card border border-line px-4 font-medium transition-transform duration-fast ease-soft active:scale-[0.98] disabled:opacity-50"
        >
          Recharger
        </button>
        <button
          type="button"
          onClick={() => void clearCachesAndReload()}
          disabled={busy}
          className="min-h-11 rounded-card border border-line px-4 font-medium transition-transform duration-fast ease-soft active:scale-[0.98] disabled:opacity-50"
        >
          Vider le cache et recharger
        </button>
      </div>

      {sample.length > 0 && (
        <div>
          <h3 className="mb-2 font-medium">Échantillon de {sample.length} prénoms</h3>
          <ul className="flex flex-col gap-2">
            {sample.map((entry) => (
              <li key={entry.id} className="rounded-card border border-line p-3">
                <p className="text-lg font-semibold">
                  {entry.label}{' '}
                  <code className="text-xs font-normal text-ink-muted">{entry.id}</code>
                </p>
                <pre className="mt-1 overflow-x-auto text-xs whitespace-pre-wrap text-ink-muted">
                  {`derived ${JSON.stringify(compact(entry.derived))}\nfacts ${JSON.stringify(compact(entry.facts))}`}
                </pre>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
