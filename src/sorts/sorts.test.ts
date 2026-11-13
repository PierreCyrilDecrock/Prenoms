import { filters, normalizeName, runQuery, sorts, type NameEntry } from '@/core';

/*
 * Jeu d'essai : [prénom, total, année du pic, 10 dernières années, 10 précédentes]
 * La longueur vient du prénom ; la variation vaut récent − précédent.
 */
const rows: [string, number, number, number, number][] = [
  ['Léa', 170, 2000, 20, 50], // variation −30
  ['Axel', 500, 2020, 300, 200], // +100
  ['Noël', 10, 2005, 5, 5], // 0
  ['Jean-Baptiste', 40, 2020, 30, 0], // +30
  ['Camille', 100, 1995, 0, 0], // 0
  ['Élodie', 100, 1985, 0, 10], // −10
];
const entries: NameEntry[] = rows.map(([label, total, peakYear, recent, previous]) => ({
  id: normalizeName(label),
  label,
  derived: { length: normalizeName(label).replace(/[^a-z]/g, '').length },
  facts: { insee: { total, peakYear, recent, previous } },
}));

const context = { filters, sorts, loadedSources: ['insee'] };
const order = (sortId: string, direction: 'asc' | 'desc') =>
  runQuery(entries, { sortId, direction }, context).map((entry) => entry.label);

/** Ordre croissant attendu ; les égalités sont départagées par ordre alphabétique. */
const expected: Record<string, { asc: string[]; desc: string[] }> = {
  alphabetical: {
    asc: ['Axel', 'Camille', 'Élodie', 'Jean-Baptiste', 'Léa', 'Noël'],
    desc: ['Noël', 'Léa', 'Jean-Baptiste', 'Élodie', 'Camille', 'Axel'],
  },
  totalPopularity: {
    asc: ['Noël', 'Jean-Baptiste', 'Camille', 'Élodie', 'Léa', 'Axel'],
    desc: ['Axel', 'Léa', 'Camille', 'Élodie', 'Jean-Baptiste', 'Noël'],
  },
  peakYear: {
    asc: ['Élodie', 'Camille', 'Léa', 'Noël', 'Axel', 'Jean-Baptiste'],
    desc: ['Axel', 'Jean-Baptiste', 'Noël', 'Léa', 'Camille', 'Élodie'],
  },
  length: {
    asc: ['Léa', 'Axel', 'Noël', 'Élodie', 'Camille', 'Jean-Baptiste'],
    desc: ['Jean-Baptiste', 'Camille', 'Élodie', 'Axel', 'Noël', 'Léa'],
  },
  recentPopularity: {
    asc: ['Camille', 'Élodie', 'Noël', 'Léa', 'Jean-Baptiste', 'Axel'],
    desc: ['Axel', 'Jean-Baptiste', 'Léa', 'Noël', 'Camille', 'Élodie'],
  },
  trend: {
    asc: ['Léa', 'Élodie', 'Camille', 'Noël', 'Jean-Baptiste', 'Axel'],
    desc: ['Axel', 'Jean-Baptiste', 'Camille', 'Noël', 'Élodie', 'Léa'],
  },
};

describe('tris de la v1', () => {
  it('les 6 tris sont découverts par le registre', () => {
    const ids = sorts.all().map((sort) => sort.id);
    expect(ids).toEqual(expect.arrayContaining(Object.keys(expected)));
  });

  describe.each(Object.entries(expected))('%s', (id, { asc, desc }) => {
    it('respecte le contrat Sort', () => {
      const sort = sorts.get(id)!;
      expect(sort.label).not.toBe('');
      for (const entry of entries) expect(sort.compare(entry, entry)).toBe(0);
      const [a, b] = [entries[0]!, entries[1]!];
      expect(Math.sign(sort.compare(a, b))).toBe(-Math.sign(sort.compare(b, a)) || 0);
    });

    it('trie dans le sens croissant', () => {
      expect(order(id, 'asc')).toEqual(asc);
    });

    it('trie dans le sens décroissant', () => {
      expect(order(id, 'desc')).toEqual(desc);
    });

    it('déclare la source insee s’il lit facts.insee', () => {
      const needsInsee = ['totalPopularity', 'peakYear', 'recentPopularity', 'trend'];
      expect(sorts.get(id)!.requires ?? []).toEqual(needsInsee.includes(id) ? ['insee'] : []);
    });
  });

  it('un tri INSEE est ignoré tant que la source n’est pas chargée', () => {
    const result = runQuery(
      entries,
      { sortId: 'totalPopularity', direction: 'desc' },
      { ...context, loadedSources: [] },
    );
    expect(result).toEqual(entries);
  });
});
