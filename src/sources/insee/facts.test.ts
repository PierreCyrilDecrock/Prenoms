import {
  birthsBetween,
  birthsInYear,
  countAt,
  getInseeFacts,
  getInseeYearRange,
  toRecords,
} from './facts';
import type { InseeFacts } from './facts';
import type { InseeData } from './format';

export const sampleData: InseeData = {
  meta: {
    formatVersion: 1,
    generatedAt: '2026-01-01T00:00:00.000Z',
    sourceFile: 'exemple.csv',
    yearMin: 1900,
    yearMax: 1905,
    nameCount: 3,
    totalBirths: 98,
  },
  names: [
    ['Camille', 65, 15, 50, [0, 10, 0, 5], [1, 20, 30]],
    ['Léa', 18, 0, 18, [], [1, 10, 0, 8]],
    ['Jean-Baptiste', 15, 15, 0, [3, 5, 5, 5], []],
  ],
};

describe('toRecords', () => {
  const records = toRecords(sampleData);
  const facts = (index: number) => records[index]!.facts as InseeFacts;

  it('produit un enregistrement par prénom avec ses effectifs', () => {
    expect(records.map((record) => record.label)).toEqual(['Camille', 'Léa', 'Jean-Baptiste']);
    expect(facts(0)).toMatchObject({ total: 65, male: 15, female: 50 });
  });

  it('décode les séries annuelles par sexe', () => {
    expect(facts(0).byYear).toEqual({
      male: { start: 1900, counts: [10, 0, 5] },
      female: { start: 1901, counts: [20, 30] },
    });
    expect(facts(1).byYear.male).toBeNull();
  });

  it('calcule la première et la dernière année', () => {
    expect(facts(0)).toMatchObject({ firstYear: 1900, lastYear: 1902 });
    expect(facts(1)).toMatchObject({ firstYear: 1901, lastYear: 1903 });
  });

  it('calcule le pic, les deux sexes confondus', () => {
    expect(facts(0)).toMatchObject({ peakYear: 1902, peakCount: 35 });
    expect(facts(1)).toMatchObject({ peakYear: 1901, peakCount: 10 });
  });

  it('retient l’année la plus ancienne en cas d’égalité au pic', () => {
    expect(facts(2)).toMatchObject({ peakYear: 1903, peakCount: 5 });
  });

  it('calcule les naissances des 10 dernières années et des 10 précédentes', () => {
    const wide = toRecords({
      meta: { ...sampleData.meta, yearMin: 1900, yearMax: 1925 },
      names: [
        [
          'Test',
          60,
          60,
          0,
          [4, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 30],
          [],
        ],
      ],
    })[0]!.facts as InseeFacts;
    // 1904 : 10 (hors fenêtres) ; 1915 : 20 (1906–1915) ; 1925 : 30 (1916–1925)
    expect(wide).toMatchObject({ recent: 30, previous: 20 });
    expect(getInseeYearRange()).toEqual({ min: 1900, max: 1925 });
  });

  it('expose des aides de lecture des séries', () => {
    expect(countAt(facts(0).byYear.male, 1902)).toBe(5);
    expect(countAt(facts(0).byYear.male, 1950)).toBe(0);
    expect(countAt(null, 1900)).toBe(0);
    expect(birthsInYear(facts(0), 1901)).toBe(20);
    expect(birthsBetween(facts(0), 1901, 1902)).toBe(55);
    expect(birthsBetween(facts(0), 1800, 2100)).toBe(65);
    expect(birthsBetween(facts(0), 1950, 1960)).toBe(0);
  });

  it('getInseeFacts lit facts.insee', () => {
    const entry = { id: 'lea', label: 'Léa', derived: {}, facts: { insee: facts(1) } };
    expect(getInseeFacts(entry)?.total).toBe(18);
    expect(getInseeFacts({ ...entry, facts: {} })).toBeUndefined();
  });
});
