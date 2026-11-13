import { useState } from 'react';
import { filters, runQuery, sorts } from '@/core';
import { useNamesStore } from '@/state/namesStore';

interface Measure {
  label: string;
  ms: number;
  count: number;
}

const RESPONSE_BUDGET_MS = 100;

/** Section « Étape 11 » de la page de diagnostic : mesures de performance sur cet appareil. */
export function DevStep11() {
  const entries = useNamesStore((state) => state.entries);
  const loadedSources = useNamesStore((state) => state.loadedSources);
  const loadDurationMs = useNamesStore((state) => state.loadDurationMs);
  const fromCache = useNamesStore((state) => state.sourceMeta.insee?.fromCache === true);
  const [measures, setMeasures] = useState<Measure[]>([]);

  const run = () => {
    const context = { filters, sorts, loadedSources };
    const cases: [string, Parameters<typeof runQuery>[1]][] = [
      ['Recherche « mar » (commence par)', { search: { text: 'mar', mode: 'startsWith' } }],
      ['Recherche « ine » (finit par)', { search: { text: 'ine', mode: 'endsWith' } }],
      ['Filtre filles', { filters: { gender: { value: 'f' } } }],
      [
        'Cinq filtres combinés',
        {
          filters: {
            gender: { value: 'f' },
            trend: { value: 'up' },
            length: { min: 3, max: 6 },
            accents: { value: 'without' },
            totalPopularity: { min: 500, max: null },
          },
        },
      ],
      ['Tri alphabétique de toute la liste', { sortId: 'alphabetical', direction: 'asc' }],
      ['Tri par tendance de toute la liste', { sortId: 'trend', direction: 'desc' }],
    ];
    setMeasures(
      cases.map(([label, query]) => {
        // Meilleur temps de trois exécutions.
        let best = Infinity;
        let count = 0;
        for (let attempt = 0; attempt < 3; attempt++) {
          const start = performance.now();
          count = runQuery(entries, query, context).length;
          best = Math.min(best, performance.now() - start);
        }
        return { label, ms: best, count };
      }),
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <p data-testid="perf-load">
        Chargement des données sur cet appareil :{' '}
        <strong>
          {loadDurationMs === null ? 'en cours…' : `${Math.round(loadDurationMs)} ms`}
        </strong>
        {loadDurationMs !== null && ` (${fromCache ? 'depuis le cache' : 'par le réseau'})`}
      </p>

      <div className="flex flex-col items-start gap-2">
        <button
          type="button"
          onClick={run}
          disabled={entries.length === 0}
          className="pressable min-h-11 rounded-card border border-line px-4 font-medium disabled:opacity-50"
        >
          Mesurer le temps de réponse
        </button>
        {measures.length > 0 && (
          <table className="w-full text-sm" data-testid="perf-measures">
            <caption className="mb-1 text-left text-ink-muted">
              Budget : moins de {RESPONSE_BUDGET_MS} ms par requête, sur{' '}
              {entries.length.toLocaleString('fr-FR')} prénoms.
            </caption>
            <thead>
              <tr className="border-b border-line text-left text-ink-muted">
                <th className="py-2 pr-3 font-medium">Requête</th>
                <th className="py-2 pr-3 text-right font-medium">Résultats</th>
                <th className="py-2 text-right font-medium">Temps</th>
              </tr>
            </thead>
            <tbody>
              {measures.map((measure) => (
                <tr key={measure.label} className="border-b border-line last:border-b-0">
                  <th scope="row" className="py-2 pr-3 text-left font-normal">
                    {measure.label}
                  </th>
                  <td className="py-2 pr-3 text-right">{measure.count.toLocaleString('fr-FR')}</td>
                  <td className="py-2 text-right font-medium">
                    {measure.ms.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ms{' '}
                    <span
                      className={measure.ms < RESPONSE_BUDGET_MS ? 'text-success' : 'text-danger'}
                    >
                      {measure.ms < RESPONSE_BUDGET_MS ? '(dans le budget)' : '(hors budget)'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-sm text-ink-muted">
        Les scores Lighthouse, les résultats de l’audit axe et des scénarios de bout en bout sont
        notés dans <code>PROGRESS.md</code>. Pour le clavier : la touche Tab, depuis l’application,
        commence par le lien « Aller aux résultats ».
      </p>
    </div>
  );
}
