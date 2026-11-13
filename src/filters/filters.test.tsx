import { fireEvent, render, screen } from '@testing-library/react';
import { derivedFields, filters, mergeSources, runQuery, sorts, type AnyFilter } from '@/core';
import { toRecords } from '@/sources/insee/facts';
import type { InseeNameRow, InseeSeries } from '@/sources/insee/format';
import accents from './accents';
import compound from './compound';
import gender from './gender';
import initial from './initial';
import length from './length';
import letters from './letters';
import peakPeriod from './peakPeriod';
import periodPopularity from './periodPopularity';
import textSearch from './textSearch';
import totalPopularity from './totalPopularity';
import trend from './trend';

const YEAR_MIN = 1990;
const YEAR_MAX = 2023;

type Years = Record<number, number>;
function series(years: Years): InseeSeries {
  const keys = Object.keys(years).map(Number);
  if (keys.length === 0) return [];
  const first = Math.min(...keys);
  const counts: number[] = [];
  for (let year = first; year <= Math.max(...keys); year++) counts.push(years[year] ?? 0);
  return [first - YEAR_MIN, ...counts];
}
function row(label: string, male: Years, female: Years): InseeNameRow {
  const sum = (years: Years) => Object.values(years).reduce((a, b) => a + b, 0);
  return [label, sum(male) + sum(female), sum(male), sum(female), series(male), series(female)];
}

/*
 * Jeu d'essai (fenêtres de tendance : 2014–2023 contre 2004–2013) :
 * Léa            fille   170 naissances, pic 2000, en baisse (20 contre 50)
 * Camille        mixte   100 naissances, pic 1995, sans tendance
 * Jean-Baptiste  garçon   40 naissances, pic 2020, en hausse, composé
 * Noël           garçon   10 naissances, pic 2005, stable (5 contre 5), accent
 * Axel           garçon  500 naissances, pic 2020, en hausse
 * Marie Ange     fille     8 naissances, pic 1992, composé (espace)
 */
const names = [
  row('Léa', {}, { 2000: 100, 2010: 50, 2020: 20 }),
  row('Camille', { 1995: 40 }, { 1995: 60 }),
  row('Jean-Baptiste', { 1990: 10, 2020: 30 }, {}),
  row('Noël', { 2005: 5, 2015: 5 }, {}),
  row('Axel', { 2010: 200, 2020: 300 }, {}),
  row('Marie Ange', {}, { 1992: 8 }),
];
const data = {
  meta: {
    formatVersion: 1,
    generatedAt: '',
    sourceFile: '',
    yearMin: YEAR_MIN,
    yearMax: YEAR_MAX,
    nameCount: names.length,
    totalBirths: 0,
  },
  names,
};
const entries = mergeSources(
  [{ id: 'insee', data: { records: toRecords(data) } }],
  derivedFields.all(),
);

function pass<P>(filter: { test: AnyFilter['test'] }, params: P): string[] {
  return entries.filter((entry) => filter.test(entry, params)).map((entry) => entry.label);
}

const EXPECTED_IDS = [
  'accents',
  'compound',
  'gender',
  'initial',
  'length',
  'letters',
  'peakPeriod',
  'periodPopularity',
  'textSearch',
  'totalPopularity',
  'trend',
];
const GROUPS = ['Texte', 'Popularité', 'Chronologie', 'Forme'];

describe('filtres de la v1 – contrat commun', () => {
  it('les 11 filtres sont découverts par le registre', () => {
    expect(
      filters
        .all()
        .map((filter) => filter.id)
        .sort(),
    ).toEqual(EXPECTED_IDS);
  });

  describe.each(filters.all().map((filter) => [filter.id, filter] as const))(
    '%s',
    (_id, filter) => {
      it('appartient à un groupe connu et est inactif par défaut', () => {
        expect(GROUPS).toContain(filter.group);
        expect(filter.isActive(filter.defaultParams)).toBe(false);
      });

      it('fait l’aller-retour URL de ses paramètres par défaut', () => {
        expect(filter.fromUrl(filter.toUrl(filter.defaultParams))).toEqual(filter.defaultParams);
      });

      it.each(['', 'n’importe quoi', '%%%', '-', '~', '@', 'z:z:z', '9999999999999-1'])(
        'ne lève pas et reste inactif ou cohérent pour la valeur d’URL « %s »',
        (value) => {
          const params = filter.fromUrl(value);
          expect(() => filter.isActive(params)).not.toThrow();
          expect(() => entries.forEach((entry) => filter.test(entry, params))).not.toThrow();
          expect(filter.fromUrl(filter.toUrl(params))).toEqual(params);
        },
      );

      it('affiche son contrôle', () => {
        const { container } = render(
          <filter.Control value={filter.defaultParams} onChange={vi.fn()} />,
        );
        expect(container.querySelector('input, button')).not.toBeNull();
      });

      it('déclare la source insee s’il lit facts.insee ou un champ qui en dépend', () => {
        const needsInsee = ['gender', 'totalPopularity', 'periodPopularity', 'peakPeriod', 'trend'];
        expect(filter.requires ?? []).toEqual(needsInsee.includes(filter.id) ? ['insee'] : []);
      });
    },
  );
});

describe('textSearch', () => {
  it('filtre selon les trois modes, sans tenir compte des accents ni de la casse', () => {
    expect(pass(textSearch, { text: 'LE', mode: 'startsWith' })).toEqual(['Léa']);
    expect(pass(textSearch, { text: 'é', mode: 'contains' })).toEqual([
      'Léa',
      'Camille',
      'Jean-Baptiste',
      'Noël',
      'Axel',
      'Marie Ange',
    ]);
    expect(pass(textSearch, { text: 'el', mode: 'endsWith' })).toEqual(['Noël', 'Axel']);
    expect(textSearch.isActive({ text: '  ', mode: 'contains' })).toBe(false);
  });

  it('sérialise le mode et le texte', () => {
    expect(textSearch.toUrl({ text: 'léa', mode: 'endsWith' })).toBe('e:léa');
    expect(textSearch.fromUrl('c:ma:rie')).toEqual({ text: 'ma:rie', mode: 'contains' });
    expect(textSearch.fromUrl('x:lea')).toEqual(textSearch.defaultParams);
  });

  it('son contrôle modifie le texte et le mode', () => {
    const onChange = vi.fn();
    render(<textSearch.Control value={{ text: '', mode: 'startsWith' }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Texte'), { target: { value: 'ma' } });
    expect(onChange).toHaveBeenLastCalledWith({ text: 'ma', mode: 'startsWith' });
    fireEvent.click(screen.getByLabelText('Finit par'));
    expect(onChange).toHaveBeenLastCalledWith({ text: '', mode: 'endsWith' });
  });
});

describe('initial', () => {
  it('garde les prénoms dont l’initiale est choisie', () => {
    expect(pass(initial, { letters: ['L'] })).toEqual(['Léa']);
    expect(pass(initial, { letters: ['A', 'N'] })).toEqual(['Noël', 'Axel']);
  });

  it('sérialise les lettres triées et ignore le reste', () => {
    expect(initial.toUrl({ letters: ['N', 'A'] })).toBe('AN');
    expect(initial.fromUrl('na1é?a')).toEqual({ letters: ['A', 'N'] });
  });

  it('son contrôle ajoute et retire une initiale', () => {
    const onChange = vi.fn();
    const { rerender } = render(<initial.Control value={{ letters: ['B'] }} onChange={onChange} />);
    expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'A' }));
    expect(onChange).toHaveBeenLastCalledWith({ letters: ['A', 'B'] });
    rerender(<initial.Control value={{ letters: ['A', 'B'] }} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    expect(onChange).toHaveBeenLastCalledWith({ letters: ['A'] });
  });
});

describe('length', () => {
  it('filtre sur le nombre de lettres, bornes incluses', () => {
    expect(pass(length, { min: null, max: 3 })).toEqual(['Léa']);
    expect(pass(length, { min: 4, max: 4 })).toEqual(['Noël', 'Axel']);
    expect(pass(length, { min: 9, max: null })).toEqual(['Jean-Baptiste', 'Marie Ange']);
  });

  it('sérialise l’intervalle', () => {
    expect(length.toUrl({ min: 3, max: 6 })).toBe('3-6');
    expect(length.fromUrl('3-')).toEqual({ min: 3, max: null });
    expect(length.fromUrl('-6')).toEqual({ min: null, max: 6 });
    expect(length.fromUrl('abc')).toEqual({ min: null, max: null });
  });

  it('son contrôle modifie les bornes', () => {
    const onChange = vi.fn();
    render(<length.Control value={{ min: null, max: 6 }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Lettres min.'), { target: { value: '3' } });
    expect(onChange).toHaveBeenLastCalledWith({ min: 3, max: 6 });
    fireEvent.change(screen.getByLabelText('Lettres max.'), { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith({ min: null, max: null });
  });
});

describe('letters', () => {
  it('exige toutes les lettres incluses et aucune lettre exclue', () => {
    expect(pass(letters, { include: 'ae', exclude: '' })).toEqual([
      'Léa',
      'Camille',
      'Jean-Baptiste',
      'Axel',
      'Marie Ange',
    ]);
    expect(pass(letters, { include: 'ÉA', exclude: 'l' })).toEqual(['Jean-Baptiste', 'Marie Ange']);
    expect(pass(letters, { include: '', exclude: 'a' })).toEqual(['Noël']);
    expect(letters.isActive({ include: ' -', exclude: '' })).toBe(false);
  });

  it('sérialise les deux listes de lettres', () => {
    expect(letters.toUrl({ include: 'Éa a', exclude: 'XY' })).toBe('ea~xy');
    expect(letters.fromUrl('ea~xy')).toEqual({ include: 'ea', exclude: 'xy' });
    expect(letters.fromUrl('ea')).toEqual(letters.defaultParams);
  });
});

describe('gender', () => {
  it('sépare filles, garçons et mixtes d’après la part féminine', () => {
    expect(pass(gender, { value: 'f' })).toEqual(['Léa', 'Marie Ange']);
    expect(pass(gender, { value: 'm' })).toEqual(['Jean-Baptiste', 'Noël', 'Axel']);
    expect(pass(gender, { value: 'x' })).toEqual(['Camille']);
  });

  it('sérialise son choix', () => {
    expect(gender.toUrl({ value: 'x' })).toBe('x');
    expect(gender.fromUrl('f')).toEqual({ value: 'f' });
    expect(gender.fromUrl('autre')).toEqual({ value: '' });
  });
});

describe('totalPopularity', () => {
  it('filtre sur les naissances cumulées, bornes incluses', () => {
    expect(pass(totalPopularity, { min: 100, max: null })).toEqual(['Léa', 'Camille', 'Axel']);
    expect(pass(totalPopularity, { min: null, max: 10 })).toEqual(['Noël', 'Marie Ange']);
    expect(pass(totalPopularity, { min: 40, max: 170 })).toEqual([
      'Léa',
      'Camille',
      'Jean-Baptiste',
    ]);
  });

  it('sérialise l’intervalle', () => {
    expect(totalPopularity.toUrl({ min: 1000, max: null })).toBe('1000-');
    expect(totalPopularity.fromUrl('1000-5000')).toEqual({ min: 1000, max: 5000 });
  });
});

describe('periodPopularity', () => {
  it('exige un minimum de naissances sur la période, bornes incluses', () => {
    expect(pass(periodPopularity, { min: 30, from: 2015, to: 2023 })).toEqual([
      'Jean-Baptiste',
      'Axel',
    ]);
    expect(pass(periodPopularity, { min: 50, from: 1990, to: 2000 })).toEqual(['Léa', 'Camille']);
    expect(pass(periodPopularity, { min: 100, from: 2000, to: 2000 })).toEqual(['Léa']);
  });

  it('prend toute la plage quand une borne manque', () => {
    expect(pass(periodPopularity, { min: 170, from: null, to: null })).toEqual(['Léa', 'Axel']);
    expect(pass(periodPopularity, { min: 100, from: 2011, to: null })).toEqual(['Axel']);
  });

  it('n’est actif que si le minimum est renseigné', () => {
    expect(periodPopularity.isActive({ min: null, from: 2000, to: 2010 })).toBe(false);
    expect(periodPopularity.isActive({ min: 0, from: null, to: null })).toBe(false);
    expect(periodPopularity.isActive({ min: 1, from: null, to: null })).toBe(true);
  });

  it('sérialise le minimum et la période', () => {
    expect(periodPopularity.toUrl({ min: 100, from: 1990, to: 2000 })).toBe('100@1990-2000');
    expect(periodPopularity.fromUrl('100@1990-')).toEqual({ min: 100, from: 1990, to: null });
    expect(periodPopularity.fromUrl('100')).toEqual(periodPopularity.defaultParams);
  });
});

describe('peakPeriod', () => {
  it('filtre sur l’année du pic, bornes incluses', () => {
    expect(pass(peakPeriod, { min: 2000, max: 2009 })).toEqual(['Léa', 'Noël']);
    expect(pass(peakPeriod, { min: 2020, max: null })).toEqual(['Jean-Baptiste', 'Axel']);
    expect(pass(peakPeriod, { min: null, max: 1995 })).toEqual(['Camille', 'Marie Ange']);
  });

  it('propose des raccourcis par décennie', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <peakPeriod.Control value={{ min: null, max: null }} onChange={onChange} />,
    );
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      '1990',
      '2000',
      '2010',
      '2020',
    ]);
    fireEvent.click(screen.getByRole('button', { name: '2000' }));
    expect(onChange).toHaveBeenLastCalledWith({ min: 2000, max: 2009 });
    rerender(<peakPeriod.Control value={{ min: 2000, max: 2009 }} onChange={onChange} />);
    expect(screen.getByRole('button', { name: '2000' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: '2000' }));
    expect(onChange).toHaveBeenLastCalledWith({ min: null, max: null });
  });

  it('sérialise l’intervalle', () => {
    expect(peakPeriod.toUrl({ min: 1980, max: 1989 })).toBe('1980-1989');
    expect(peakPeriod.fromUrl('1980-1989')).toEqual({ min: 1980, max: 1989 });
  });
});

describe('trend', () => {
  it('compare les 10 dernières années aux 10 précédentes', () => {
    expect(pass(trend, { value: 'up' })).toEqual(['Jean-Baptiste', 'Axel']);
    expect(pass(trend, { value: 'down' })).toEqual(['Léa']);
  });

  it('sérialise son choix', () => {
    expect(trend.toUrl({ value: 'up' })).toBe('up');
    expect(trend.fromUrl('down')).toEqual({ value: 'down' });
    expect(trend.fromUrl('stable')).toEqual({ value: '' });
  });
});

describe('compound', () => {
  it('garde ou exclut les prénoms composés (tiret ou espace)', () => {
    expect(pass(compound, { value: 'only' })).toEqual(['Jean-Baptiste', 'Marie Ange']);
    expect(pass(compound, { value: 'exclude' })).toEqual(['Léa', 'Camille', 'Noël', 'Axel']);
  });

  it('sérialise son choix', () => {
    expect(compound.toUrl({ value: 'only' })).toBe('only');
    expect(compound.fromUrl('exclude')).toEqual({ value: 'exclude' });
    expect(compound.fromUrl('?')).toEqual({ value: '' });
  });
});

describe('accents', () => {
  it('garde les prénoms avec ou sans accent', () => {
    expect(pass(accents, { value: 'with' })).toEqual(['Léa', 'Noël']);
    expect(pass(accents, { value: 'without' })).toEqual([
      'Camille',
      'Jean-Baptiste',
      'Axel',
      'Marie Ange',
    ]);
  });

  it('sérialise son choix', () => {
    expect(accents.toUrl({ value: 'with' })).toBe('with');
    expect(accents.fromUrl('without')).toEqual({ value: 'without' });
  });
});

describe('filtres combinés dans le pipeline', () => {
  const context = { filters, sorts, loadedSources: ['insee'] };
  const run = (params: Record<string, unknown>) =>
    runQuery(entries, { filters: params }, context).map((entry) => entry.label);

  it('combiner deux filtres réduit le résultat', () => {
    expect(run({ gender: { value: 'm' } })).toEqual(['Jean-Baptiste', 'Noël', 'Axel']);
    expect(run({ gender: { value: 'm' }, trend: { value: 'up' } })).toEqual([
      'Jean-Baptiste',
      'Axel',
    ]);
    expect(
      run({ gender: { value: 'm' }, trend: { value: 'up' }, compound: { value: 'exclude' } }),
    ).toEqual(['Axel']);
  });

  it('les filtres INSEE sont ignorés tant que la source n’est pas chargée', () => {
    const result = runQuery(
      entries,
      { filters: { gender: { value: 'm' }, accents: { value: 'with' } } },
      { ...context, loadedSources: [] },
    );
    expect(result.map((entry) => entry.label)).toEqual(['Léa', 'Noël']);
  });
});
