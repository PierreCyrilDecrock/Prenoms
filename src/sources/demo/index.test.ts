import { mergeSources } from '@/core';
import { getDemoFacts } from './facts';
import demo from './index';

describe('source demo', () => {
  it('fournit une dizaine de prénoms et signale la fin du chargement', async () => {
    const onProgress = vi.fn();
    const data = await demo.load(onProgress);
    expect(data.records).toHaveLength(10);
    expect(onProgress).toHaveBeenLastCalledWith(1);
  });

  it('range ses faits sous facts.demo, fusionnés par forme normalisée', async () => {
    const other = { id: 'autre', data: { records: [{ label: 'LEA', facts: {} }] } };
    const entries = mergeSources([other, { id: demo.id, data: await demo.load() }], []);
    const lea = entries.find((entry) => entry.id === 'lea')!;
    expect(lea.facts).toEqual({ autre: {}, demo: { origin: 'hébraïque', syllables: 2 } });
    expect(getDemoFacts(lea)?.syllables).toBe(2);
  });
});
