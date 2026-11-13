import { DEFAULT_SORT, initialQuery, useQueryStore } from './queryStore';

describe('queryStore', () => {
  beforeEach(() => useQueryStore.setState(initialQuery));

  it('démarre sans recherche ni filtre, avec le tri par défaut', () => {
    expect(useQueryStore.getState()).toMatchObject({
      search: '',
      mode: 'startsWith',
      filterParams: {},
      ...DEFAULT_SORT,
    });
  });

  it('modifie la recherche, le mode et le tri', () => {
    const state = useQueryStore.getState();
    state.setSearch('léa');
    state.setMode('contains');
    state.setSort('alphabetical');
    state.setDirection('asc');
    expect(useQueryStore.getState()).toMatchObject({
      search: 'léa',
      mode: 'contains',
      sortId: 'alphabetical',
      direction: 'asc',
    });
  });

  it('pose et retire les paramètres d’un filtre sans toucher aux autres', () => {
    const state = useQueryStore.getState();
    state.setFilter('a', { value: 1 });
    state.setFilter('b', { value: 2 });
    state.clearFilter('a');
    expect(useQueryStore.getState().filterParams).toEqual({ b: { value: 2 } });
  });

  it('resetAll efface la recherche et les filtres, pas le tri', () => {
    const state = useQueryStore.getState();
    state.setSearch('x');
    state.setFilter('a', 1);
    state.setSort('alphabetical');
    state.resetAll();
    expect(useQueryStore.getState()).toMatchObject({
      search: '',
      filterParams: {},
      sortId: 'alphabetical',
    });
  });
});
