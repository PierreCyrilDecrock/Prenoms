import { readFileSync } from 'node:fs';
import {
  buildInseeData,
  parseInseeCsv,
  seriesTotal,
  toDisplayLabel,
  toSeries,
  validateInseeData,
} from './insee.ts';

const csv = readFileSync('data/fixtures/insee-sample.csv', 'utf8');
const options = { sourceFile: 'insee-sample.csv', generatedAt: '2026-01-01T00:00:00.000Z' };

describe('parseInseeCsv', () => {
  it('lit les lignes (séparateur « ; », fins de ligne CRLF)', () => {
    const { rows, invalid } = parseInseeCsv(csv);
    expect(invalid).toEqual([]);
    expect(rows).toHaveLength(13);
    expect(rows[2]).toEqual({ sex: 1, name: 'CAMILLE', year: '1900', count: 10 });
    expect(rows[4]).toEqual({ sex: 1, name: 'CAMILLE', year: 'XXXX', count: 7 });
  });

  it('refuse un en-tête inattendu', () => {
    expect(() => parseInseeCsv('a;b;c\n1;X;1900;3')).toThrow(/En-tête inattendu/);
  });

  it('signale les lignes illisibles sans les perdre', () => {
    const { rows, invalid } = parseInseeCsv(
      'sexe;preusuel;annais;nombre\n3;X;1900;3\n1;Y;19;3\n1;Z;1900;abc\n1;;1900;3\n1;OK;1900;3\n',
    );
    expect(rows).toHaveLength(1);
    expect(invalid.map((entry) => entry.line)).toEqual([2, 3, 4, 5]);
  });
});

describe('toDisplayLabel', () => {
  it.each([
    ['LÉA', 'Léa'],
    ['JEAN-BAPTISTE', 'Jean-Baptiste'],
    ['MARIE ANGE', 'Marie Ange'],
    ["N'GOLO", "N'Golo"],
    ["O'BRIAN", "O'Brian"],
    ["MANEC'H", "Manec'h"],
    ['ÉLODIE', 'Élodie'],
    ['A', 'A'],
  ])('%s → %s', (raw, expected) => {
    expect(toDisplayLabel(raw)).toBe(expected);
  });
});

describe('toSeries', () => {
  it('produit une série dense avec son décalage', () => {
    const series = toSeries(
      new Map([
        [1902, 5],
        [1905, 2],
      ]),
      1900,
    );
    expect(series).toEqual([2, 5, 0, 0, 2]);
    expect(seriesTotal(series)).toBe(7);
  });

  it('renvoie un tableau vide sans naissance', () => {
    expect(toSeries(new Map(), 1900)).toEqual([]);
    expect(seriesTotal([])).toBe(0);
  });
});

describe('buildInseeData', () => {
  const { data, report } = buildInseeData(csv, options);

  it('remplit le bloc meta', () => {
    expect(data.meta).toEqual({
      formatVersion: 1,
      generatedAt: options.generatedAt,
      sourceFile: 'insee-sample.csv',
      yearMin: 1900,
      yearMax: 1903,
      nameCount: 4,
      totalBirths: 98,
    });
  });

  it('produit une entrée compacte par prénom, de la plus donnée à la moins donnée', () => {
    expect(data.names).toEqual([
      ['Camille', 65, 15, 50, [0, 10, 0, 5], [1, 20, 30]],
      ['Léa', 18, 0, 18, [], [1, 10, 0, 8]],
      ['Jean-Baptiste', 12, 12, 0, [3, 12], []],
      ["N'Golo", 3, 3, 0, [2, 3], []],
    ]);
  });

  it('fusionne les graphies qui ne diffèrent que par les accents, sous la plus fréquente', () => {
    expect(report.mergedVariants).toBe(1);
    expect(data.names.map((name) => name[0])).toContain('Léa');
    expect(data.names.map((name) => name[0])).not.toContain('Lea');
  });

  it('compte les lignes exclues au lieu de les perdre', () => {
    expect(report.csv).toEqual({ rows: 13, births: 264, distinctNames: 6 });
    expect(report.excluded).toEqual({
      unknownYear: { rows: 2, births: 16 },
      rareNames: { rows: 2, births: 150 },
      invalid: { rows: 0, births: 0 },
      namesWithoutKnownYear: 1,
    });
    const { unknownYear, rareNames } = report.excluded;
    expect(data.meta.totalBirths + unknownYear.births + rareNames.births).toBe(report.csv.births);
  });
});

describe('validateInseeData', () => {
  it('ne signale rien quand le JSON correspond au CSV', () => {
    expect(validateInseeData(csv, buildInseeData(csv, options).data)).toEqual([]);
  });

  it('détecte un effectif modifié', () => {
    const { data } = buildInseeData(csv, options);
    data.names[0]![1] += 1;
    const errors = validateInseeData(csv, data);
    expect(errors.join('\n')).toMatch(/Camille : total ≠ garçons \+ filles/);
    expect(errors.join('\n')).toMatch(/Somme des totaux : 99 dans le JSON, 98 attendu/);
  });

  it('détecte un prénom manquant', () => {
    const { data } = buildInseeData(csv, options);
    data.names.pop();
    expect(validateInseeData(csv, data).join('\n')).toMatch(/Somme des séries : 95/);
  });

  it('à effectif égal, départage par identifiant', () => {
    const tie = buildInseeData(
      'sexe;preusuel;annais;nombre\n1;ZOE;2000;5\n1;ADAM;2000;5\n1;LOU;2000;9\n',
      options,
    ).data;
    expect(tie.names.map((name) => name[0])).toEqual(['Lou', 'Adam', 'Zoe']);
  });
});
