import { filters } from '@/core';
import { DEFAULT_SORT } from './queryStore';
import {
  hashQueryString,
  isDiscreteChange,
  listHref,
  parseQuery,
  serializeQuery,
  type UrlQuery,
} from './urlState';

const base: UrlQuery = { search: '', mode: 'startsWith', filterParams: {}, ...DEFAULT_SORT };

/**
 * Un jeu de paramètres actifs pour chaque filtre livré. Un filtre ajouté plus tard teste son
 * propre aller-retour (voir docs/ajouter-un-filtre.md).
 */
const activeSamples: Record<string, unknown> = {
  accents: { value: 'with' },
  compound: { value: 'exclude' },
  favorites: { value: 'only' },
  gender: { value: 'x' },
  initial: { letters: ['A', 'M'] },
  length: { min: 3, max: 6 },
  letters: { include: 'ae', exclude: 'xy' },
  peakPeriod: { min: 1980, max: 1989 },
  periodPopularity: { min: 500, from: 1990, to: 2000 },
  textSearch: { text: 'ine', mode: 'endsWith' },
  totalPopularity: { min: 1000, max: null },
  trend: { value: 'up' },
};

describe('sérialisation de la requête dans l’URL', () => {
  it('une requête vide donne une chaîne vide', () => {
    expect(serializeQuery(base)).toBe('');
    expect(parseQuery('')).toEqual(base);
    expect(listHref(base)).toBe('#/');
  });

  it('chaque jeu d’essai correspond à un filtre du registre', () => {
    for (const id of Object.keys(activeSamples)) expect(filters.has(id), id).toBe(true);
  });

  it.each(filters.all().map((filter) => [filter.id, filter] as const))(
    'le filtre %s n’écrit rien dans l’URL tant qu’il est inactif',
    (id, filter) => {
      expect(serializeQuery({ ...base, filterParams: { [id]: filter.defaultParams } })).toBe('');
      const value = encodeURIComponent(filter.toUrl(filter.defaultParams));
      expect(parseQuery(`f.${id}=${value}`)).toEqual(base);
    },
  );

  it.each(Object.entries(activeSamples))('aller-retour du filtre %s', (id, params) => {
    const filter = filters.get(id)!;
    expect(filter.isActive(params)).toBe(true);
    expect(filter.fromUrl(filter.toUrl(params))).toEqual(params);
    const query = { ...base, filterParams: { [id]: params } };
    const serialized = serializeQuery(query);
    expect(serialized).toContain(`f.${id}=`);
    expect(parseQuery(serialized)).toEqual(query);
  });

  it('aller-retour d’une requête complète, tous filtres actifs', () => {
    const query: UrlQuery = {
      search: 'Léa & co',
      mode: 'contains',
      filterParams: activeSamples,
      sortId: 'alphabetical',
      direction: 'asc',
    };
    const serialized = serializeQuery(query);
    expect(parseQuery(serialized)).toEqual(query);
    expect(serializeQuery(parseQuery(serialized))).toBe(serialized);
    expect(listHref(query)).toBe(`#/?${serialized}`);
  });

  it('n’écrit que les filtres actifs et omet les valeurs par défaut', () => {
    const query = {
      ...base,
      search: 'mar',
      filterParams: { gender: { value: 'f' }, trend: { value: '' }, inconnu: 1 },
    };
    expect(serializeQuery(query)).toBe('q=mar&f.gender=f');
  });

  it('écrit le tri et le sens dès qu’ils diffèrent du tri par défaut', () => {
    expect(serializeQuery({ ...base, direction: 'asc' })).toBe('s=totalPopularity&d=asc');
    expect(parseQuery('s=length&d=desc')).toMatchObject({ sortId: 'length', direction: 'desc' });
  });

  it.each([
    'f.inconnu=1',
    'f.gender=zzz',
    'f.length=abc',
    'm=x',
    's=inconnu&d=asc',
    'd=desc',
    'autre=1&&=&f.=x',
    '%E0%A4%A',
  ])('ignore sans erreur le paramètre invalide « %s »', (queryString) => {
    expect(parseQuery(queryString)).toEqual(base);
  });

  it('garde les paramètres valides à côté des invalides', () => {
    expect(parseQuery('q=lea&f.gender=zzz&f.trend=up&m=c&s=inconnu')).toEqual({
      ...base,
      search: 'lea',
      mode: 'contains',
      filterParams: { trend: { value: 'up' } },
    });
  });

  it('un sens invalide avec un tri valide vaut croissant', () => {
    expect(parseQuery('s=length&d=x')).toMatchObject({ sortId: 'length', direction: 'asc' });
  });

  it('hashQueryString extrait les paramètres du hash', () => {
    expect(hashQueryString('#/?q=a&m=c')).toBe('q=a&m=c');
    expect(hashQueryString('#/')).toBe('');
    expect(hashQueryString('')).toBe('');
  });
});

describe('isDiscreteChange', () => {
  const withGender = { ...base, filterParams: { gender: { value: 'f' } } };

  it('une frappe n’est pas un changement discret', () => {
    expect(isDiscreteChange(base, { ...base, search: 'm' })).toBe(false);
    const a = { ...base, filterParams: { length: { min: 3, max: null } } };
    const b = { ...base, filterParams: { length: { min: 3, max: 6 } } };
    expect(isDiscreteChange(a, b)).toBe(false);
  });

  it('mode, tri, sens, ajout ou retrait d’un filtre sont discrets', () => {
    expect(isDiscreteChange(base, { ...base, mode: 'contains' })).toBe(true);
    expect(isDiscreteChange(base, { ...base, sortId: 'length' })).toBe(true);
    expect(isDiscreteChange(base, { ...base, direction: 'asc' })).toBe(true);
    expect(isDiscreteChange(base, withGender)).toBe(true);
    expect(isDiscreteChange(withGender, base)).toBe(true);
  });
});
