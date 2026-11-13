import { exportFileName, toCsv, toJson } from './exportData';

const entries = [
  {
    id: 'lea',
    label: 'Léa',
    derived: { length: 3, hasAccent: true, femaleShare: 0.98765, tags: ['x'] },
    facts: {
      insee: { total: 1234, peakYear: 2000, byYear: { female: { start: 1900, counts: [1] } } },
    },
  },
  {
    id: 'jean; "le" grand',
    label: 'Jean; "le" grand',
    derived: { length: 13, hasAccent: false },
    facts: { insee: { total: 5 }, demo: { origin: 'hébreu', rare: true } },
  },
];

describe('toCsv', () => {
  const csv = toCsv(entries);
  const lines = csv.slice(1).split('\r\n');

  it('commence par un BOM UTF-8 et utilise CRLF', () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.endsWith('\r\n')).toBe(true);
    expect(lines).toHaveLength(4);
  });

  it('a une colonne par champ calculé et par fait simple de chaque source', () => {
    expect(lines[0]).toBe(
      'id;prenom;derived.length;derived.hasAccent;derived.femaleShare;insee.total;insee.peakYear;demo.origin;demo.rare',
    );
  });

  it('garde les accents, écrit les décimales à la française et laisse vides les valeurs absentes', () => {
    expect(lines[1]).toBe('lea;Léa;3;oui;0,9877;1234;2000;;');
  });

  it('protège les séparateurs et les guillemets', () => {
    expect(lines[2]).toBe('"jean; ""le"" grand";"Jean; ""le"" grand";13;non;;5;;hébreu;oui');
  });

  it('ne garde que l’en-tête pour une liste vide', () => {
    expect(toCsv([])).toBe('﻿id;prenom\r\n');
  });
});

describe('toJson', () => {
  it('contient les champs calculés et tous les faits, séries comprises', () => {
    const parsed = JSON.parse(toJson(entries)) as unknown[];
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toEqual({
      id: 'lea',
      prenom: 'Léa',
      derived: entries[0]!.derived,
      facts: entries[0]!.facts,
    });
  });
});

describe('exportFileName', () => {
  it('date le fichier', () => {
    expect(exportFileName('csv', new Date('2026-11-13T10:00:00Z'))).toBe('prenoms-2026-11-13.csv');
    expect(exportFileName('json', new Date('2026-01-02T10:00:00Z'))).toBe(
      'prenoms-2026-01-02.json',
    );
  });
});
