import type { AnyFilter, Filter } from './filter';
import { normalizeName } from './normalizeName';
import { runQuery, type QueryContext } from './query';
import { createRegistry } from './registry';
import type { NameEntry, Sort } from './types';

/* Filtres et tris FACTICES : le pipeline ne connaît aucun module réel. */

const entry = (label: string, score = 0): NameEntry => ({
  id: normalizeName(label),
  label,
  derived: { length: normalizeName(label).length },
  facts: { fake: { score } },
});

const score = (item: NameEntry) => (item.facts.fake as { score: number }).score;

function fakeFilter<P>(
  id: string,
  defaultParams: P,
  test: (entry: NameEntry, params: P) => boolean,
  extra: Partial<Filter<P>> = {},
): Filter<P> {
  return {
    id,
    label: id,
    group: 'Factice',
    defaultParams,
    isActive: (params) => params !== defaultParams,
    test,
    Control: () => null,
    toUrl: (params) => JSON.stringify(params),
    fromUrl: (value) => JSON.parse(value) as P,
    ...extra,
  };
}

const minScore = fakeFilter<number>('minScore', 0, (item, min) => score(item) >= min);
const maxLength = fakeFilter<number>(
  'maxLength',
  0,
  (item, max) => (item.derived.length as number) <= max,
);
const needsOther = fakeFilter<number>('needsOther', 0, () => false, { requires: ['other'] });

const byScore: Sort = { id: 'score', label: 'Score', compare: (a, b) => score(a) - score(b) };
const byOther: Sort = { id: 'other', label: 'Autre', requires: ['other'], compare: () => 0 };

const modules = (items: { id: string }[]) =>
  Object.fromEntries(items.map((item) => [item.id, { default: item }]));

const context: QueryContext = {
  filters: createRegistry<AnyFilter>('filtre', modules([minScore, maxLength, needsOther])),
  sorts: createRegistry<Sort>('tri', modules([byScore, byOther])),
  loadedSources: ['fake'],
};

const names = [
  entry('Léa', 5),
  entry('Léon', 3),
  entry('Eléa', 5),
  entry('Noël', 1),
  entry('Anaël', 3),
  entry('Jean-Baptiste', 9),
];
const labels = (result: NameEntry[]) => result.map((item) => item.label);

describe('runQuery – recherche', () => {
  it('sans critère, renvoie une copie de la liste dans le même ordre', () => {
    const result = runQuery(names, {}, context);
    expect(result).toEqual(names);
    expect(result).not.toBe(names);
  });

  it('« commence par » est le mode par défaut', () => {
    expect(
      labels(runQuery(names, { search: { text: 'lé', mode: 'startsWith' } }, context)),
    ).toEqual(['Léa', 'Léon']);
  });

  it('« contient »', () => {
    expect(labels(runQuery(names, { search: { text: 'ea', mode: 'contains' } }, context))).toEqual([
      'Léa',
      'Eléa',
      'Jean-Baptiste',
    ]);
  });

  it('« finit par »', () => {
    expect(labels(runQuery(names, { search: { text: 'EL', mode: 'endsWith' } }, context))).toEqual([
      'Noël',
      'Anaël',
    ]);
  });

  it('est insensible à la casse et aux accents', () => {
    const variants = ['lea', 'Léa', 'LEA', ' léa ', 'LÉA'].map((text) =>
      runQuery(names, { search: { text, mode: 'contains' } }, context),
    );
    for (const result of variants) expect(result).toEqual(variants[0]);
    expect(variants[0]).toHaveLength(2);
  });

  it('ignore une recherche vide ou faite d’espaces', () => {
    expect(runQuery(names, { search: { text: '   ', mode: 'contains' } }, context)).toHaveLength(6);
  });
});

describe('runQuery – filtres', () => {
  it('applique les filtres actifs du registre', () => {
    expect(labels(runQuery(names, { filters: { minScore: 5 } }, context))).toEqual([
      'Léa',
      'Eléa',
      'Jean-Baptiste',
    ]);
  });

  it('combine recherche et filtres (ET logique)', () => {
    const result = runQuery(
      names,
      { search: { text: 'l', mode: 'contains' }, filters: { minScore: 3, maxLength: 4 } },
      context,
    );
    expect(labels(result)).toEqual(['Léa', 'Léon', 'Eléa']);
  });

  it('ignore un filtre inactif (isActive faux)', () => {
    expect(runQuery(names, { filters: { minScore: 0 } }, context)).toHaveLength(6);
  });

  it('ignore un filtre inconnu', () => {
    expect(runQuery(names, { filters: { inconnu: 1 } }, context)).toHaveLength(6);
  });

  it('ignore un filtre dont une source requise n’est pas chargée', () => {
    expect(runQuery(names, { filters: { needsOther: 1 } }, context)).toHaveLength(6);
    const withOther = { ...context, loadedSources: ['fake', 'other'] };
    expect(runQuery(names, { filters: { needsOther: 1 } }, withOther)).toHaveLength(0);
  });

  it('donne le même résultat quel que soit l’ordre des filtres', () => {
    const a = runQuery(names, { filters: { minScore: 3, maxLength: 4 } }, context);
    const b = runQuery(names, { filters: { maxLength: 4, minScore: 3 } }, context);
    expect(a).toEqual(b);
  });
});

describe('runQuery – tri', () => {
  it('trie dans le sens croissant par défaut, avec départage alphabétique', () => {
    expect(labels(runQuery(names, { sortId: 'score' }, context))).toEqual([
      'Noël',
      'Anaël',
      'Léon',
      'Eléa',
      'Léa',
      'Jean-Baptiste',
    ]);
  });

  it('trie dans le sens décroissant, le départage restant alphabétique', () => {
    expect(labels(runQuery(names, { sortId: 'score', direction: 'desc' }, context))).toEqual([
      'Jean-Baptiste',
      'Eléa',
      'Léa',
      'Anaël',
      'Léon',
      'Noël',
    ]);
  });

  it('donne un résultat stable quel que soit l’ordre d’entrée', () => {
    const reversed = [...names].reverse();
    expect(runQuery(reversed, { sortId: 'score' }, context)).toEqual(
      runQuery(names, { sortId: 'score' }, context),
    );
  });

  it('conserve l’ordre d’entrée pour un tri inconnu ou indisponible', () => {
    expect(runQuery(names, { sortId: 'inconnu' }, context)).toEqual(names);
    expect(runQuery(names, { sortId: 'other' }, context)).toEqual(names);
  });

  it('ne modifie pas la liste d’entrée', () => {
    const copy = [...names];
    runQuery(names, { sortId: 'score', direction: 'desc', filters: { minScore: 3 } }, context);
    expect(names).toEqual(copy);
  });
});

describe('runQuery – performance', () => {
  it('exécute 5 filtres, une recherche et un tri sur 50 000 entrées en moins de 100 ms', () => {
    const syllables = ['ma', 'lé', 'jo', 'an', 'ri', 'no', 'él', 'th', 'ou', 'cl', 'be', 'za'];
    const synthetic: NameEntry[] = [];
    for (let i = 0; i < 50_000; i++) {
      let label = '';
      for (let n = i, k = 0; k < 2 + (i % 4); k++, n = Math.floor(n / 12) + k) {
        label += syllables[n % 12];
      }
      const item = entry(`${label}${i}`, (i * 7919) % 1000);
      item.derived.parity = i % 2;
      item.derived.bucket = i % 10;
      synthetic.push(item);
    }

    const filters = [
      fakeFilter<number>('f1', 0, (item, min) => score(item) >= min),
      fakeFilter<number>('f2', 0, (item, max) => (item.derived.length as number) <= max),
      fakeFilter<number>('f3', -1, (item, parity) => item.derived.parity === parity),
      fakeFilter<number>('f4', -1, (item, bucket) => (item.derived.bucket as number) !== bucket),
      fakeFilter<string>('f5', '', (item, letter) => item.id.includes(letter)),
    ];
    const perfContext: QueryContext = {
      filters: createRegistry<AnyFilter>('filtre', modules(filters)),
      sorts: context.sorts,
      loadedSources: ['fake'],
    };
    const query = {
      search: { text: 'a', mode: 'contains' as const },
      filters: { f1: 100, f2: 14, f3: 0, f4: 3, f5: 'e' },
      sortId: 'score',
      direction: 'desc' as const,
    };

    const result = runQuery(synthetic, query, perfContext);
    expect(result.length).toBeGreaterThan(1000);
    expect(result.length).toBeLessThan(50_000);

    // Meilleur temps de 5 exécutions, pour ne pas dépendre de la charge de la machine.
    let best = Infinity;
    for (let run = 0; run < 5; run++) {
      const start = performance.now();
      runQuery(synthetic, query, perfContext);
      best = Math.min(best, performance.now() - start);
    }
    console.info(`runQuery : ${result.length} résultats sur 50 000 en ${best.toFixed(1)} ms`);
    expect(best).toBeLessThan(100);
  });
});
