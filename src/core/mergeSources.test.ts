import { mergeSources } from './mergeSources';
import type { DerivedField } from './types';

const a = {
  id: 'a',
  data: {
    records: [
      { label: 'Léa', facts: { total: 3 } },
      { label: 'Noël', facts: { total: 2 } },
      { label: '  ', facts: { total: 99 } },
    ],
  },
};
const b = {
  id: 'b',
  data: {
    records: [
      { label: 'LEA', facts: { origin: 'latin' } },
      { label: 'Zoé', facts: { origin: 'grec' } },
    ],
  },
};

describe('mergeSources', () => {
  it('fusionne par forme normalisée et range chaque source sous sa clé', () => {
    const entries = mergeSources([a, b], []);
    expect(entries.map((entry) => entry.id)).toEqual(['lea', 'noel', 'zoe']);
    expect(entries[0]).toEqual({
      id: 'lea',
      label: 'Léa',
      derived: {},
      facts: { a: { total: 3 }, b: { origin: 'latin' } },
    });
    expect(entries[2]?.facts).toEqual({ b: { origin: 'grec' } });
  });

  it('ignore les prénoms vides', () => {
    expect(mergeSources([a], []).some((entry) => entry.id === '')).toBe(false);
  });

  it('calcule les champs dérivés', () => {
    const length: DerivedField<number> = { id: 'len', compute: (entry) => entry.id.length };
    const entries = mergeSources([a], [length]);
    expect(entries.map((entry) => entry.derived.len)).toEqual([3, 4]);
  });

  it('ne calcule un champ que pour les prénoms qui ont les faits requis', () => {
    const double: DerivedField<number> = {
      id: 'double',
      requires: ['a'],
      compute: (entry) => (entry.facts.a as { total: number }).total * 2,
    };
    const entries = mergeSources([a, b], [double]);
    expect(entries.map((entry) => entry.derived.double)).toEqual([6, 4, undefined]);
    expect('double' in entries[2]!.derived).toBe(false);
  });

  it('renvoie une liste vide sans source', () => {
    expect(mergeSources([], [])).toEqual([]);
  });
});
