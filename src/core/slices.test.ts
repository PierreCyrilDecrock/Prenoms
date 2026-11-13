import { mergeSources, mergeSourcesSteps } from './mergeSources';
import { runInSlices, runToEnd, SLICE_BUDGET_MS } from './slices';

function* count(to: number): Generator<void, number> {
  let total = 0;
  for (let i = 1; i <= to; i++) {
    total += i;
    yield;
  }
  return total;
}

describe('travail par tranches', () => {
  it('runToEnd exécute le générateur d’une traite', () => {
    expect(runToEnd(count(100))).toBe(5050);
  });

  it('runInSlices donne le même résultat, de façon asynchrone', async () => {
    await expect(runInSlices(count(100))).resolves.toBe(5050);
  });

  it('runInSlices rend la main quand le budget d’une tranche est dépassé', async () => {
    function* slow(): Generator<void, string> {
      for (let step = 0; step < 3; step++) {
        const start = performance.now();
        while (performance.now() - start < SLICE_BUDGET_MS + 2) {
          // Travail simulé, plus long que le budget d'une tranche.
        }
        yield;
      }
      return 'fini';
    }
    let ticks = 0;
    const timer = setInterval(() => ticks++, 0);
    await expect(runInSlices(slow())).resolves.toBe('fini');
    clearInterval(timer);
    // D'autres tâches ont pu s'exécuter entre les tranches.
    expect(ticks).toBeGreaterThan(0);
  });

  it('la fusion par tranches donne exactement le même résultat que la fusion directe', async () => {
    const records = Array.from({ length: 3500 }, (_, index) => ({
      label: `Prénom${index % 3000}`,
      facts: { index },
    }));
    const loaded = [{ id: 'a', data: { records } }];
    const fields = [{ id: 'len', compute: (entry: { id: string }) => entry.id.length }];
    const sliced = await runInSlices(mergeSourcesSteps(loaded, fields));
    expect(sliced).toEqual(mergeSources(loaded, fields));
    expect(sliced).toHaveLength(3000);
  });
});
