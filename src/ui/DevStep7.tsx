import { useMemo, useState } from 'react';
import { filters, runQuery, sorts, type SortDirection } from '@/core';
import { getInseeFacts } from '@/sources/insee/facts';
import { useNamesStore } from '@/state/namesStore';
import { ChoiceGroup } from '@/ui/controls';

const int = (value: number | undefined) => (value ?? 0).toLocaleString('fr-FR');
const signed = (value: number) => `${value > 0 ? '+' : ''}${int(value)}`;
const SHOWN = 20;

/** Section « Étape 7 » de la page de diagnostic : chaque tri, dans les deux sens. */
export function DevStep7() {
  const entries = useNamesStore((state) => state.entries);
  const loadedSources = useNamesStore((state) => state.loadedSources);
  // Un tri dont une source requise n'est pas chargée est masqué.
  const available = sorts
    .all()
    .filter((sort) => (sort.requires ?? []).every((id) => loadedSources.includes(id)));
  const [sortId, setSortId] = useState(available[0]?.id ?? '');
  const [direction, setDirection] = useState<SortDirection>('asc');

  const { result, elapsedMs } = useMemo(() => {
    const start = performance.now();
    const result = runQuery(entries, { sortId, direction }, { filters, sorts, loadedSources });
    return { result, elapsedMs: performance.now() - start };
  }, [entries, loadedSources, sortId, direction]);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Trier par
        <select
          value={sortId}
          onChange={(event) => setSortId(event.target.value)}
          className="min-h-11 rounded-card border border-line bg-surface px-3 text-base"
        >
          {available.map((sort) => (
            <option key={sort.id} value={sort.id}>
              {sort.label}
            </option>
          ))}
        </select>
      </label>
      <ChoiceGroup<SortDirection>
        legend="Sens"
        value={direction}
        onChange={setDirection}
        options={[
          { value: 'asc', label: 'Croissant' },
          { value: 'desc', label: 'Décroissant' },
        ]}
      />
      <p aria-live="polite" data-testid="sort-summary" className="text-sm text-ink-muted">
        {int(result.length)} prénoms triés en{' '}
        {elapsedMs.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ms · les {SHOWN} premiers
        :
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" data-testid="sort-results">
          <thead>
            <tr className="border-b border-line text-left text-ink-muted">
              <th className="py-2 pr-3 font-medium">Prénom</th>
              <th className="py-2 pr-3 text-right font-medium">Lettres</th>
              <th className="py-2 pr-3 text-right font-medium">Total</th>
              <th className="py-2 pr-3 text-right font-medium">Pic</th>
              <th className="py-2 pr-3 text-right font-medium">10 dern. années</th>
              <th className="py-2 text-right font-medium">Variation</th>
            </tr>
          </thead>
          <tbody>
            {result.slice(0, SHOWN).map((entry) => {
              const facts = getInseeFacts(entry);
              return (
                <tr key={entry.id} className="border-b border-line last:border-b-0">
                  <th scope="row" className="py-2 pr-3 text-left font-semibold">
                    {entry.label}
                  </th>
                  <td className="py-2 pr-3 text-right">{String(entry.derived.length ?? '')}</td>
                  <td className="py-2 pr-3 text-right">{int(facts?.total)}</td>
                  <td className="py-2 pr-3 text-right">{facts?.peakYear ?? ''}</td>
                  <td className="py-2 pr-3 text-right">{int(facts?.recent)}</td>
                  <td className="py-2 text-right">
                    {facts ? signed(facts.recent - facts.previous) : ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
