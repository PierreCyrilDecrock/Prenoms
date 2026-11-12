import { derivedFields, filters, sorts, sources } from './registries';

/*
 * Ce test ne nomme aucun module précis : il vérifie seulement que la découverte
 * automatique fonctionne et que tout module découvert respecte la forme de son contrat.
 */
describe('registres (découverte automatique)', () => {
  it('découvre au moins un module par registre', () => {
    for (const registry of [sources, derivedFields, filters, sorts]) {
      expect(registry.all().length, registry.kind).toBeGreaterThan(0);
    }
  });

  it('ne découvre que des modules conformes à leur contrat', () => {
    for (const source of sources.all()) {
      expect(typeof source.label).toBe('string');
      expect(typeof source.load).toBe('function');
    }
    for (const field of derivedFields.all()) {
      expect(typeof field.compute).toBe('function');
    }
    for (const filter of filters.all()) {
      expect(typeof filter.label).toBe('string');
      expect(typeof filter.group).toBe('string');
      for (const method of ['isActive', 'test', 'toUrl', 'fromUrl'] as const) {
        expect(typeof filter[method], `${filter.id}.${method}`).toBe('function');
      }
      expect(filter.Control).toBeDefined();
      expect(filter.fromUrl(filter.toUrl(filter.defaultParams))).toEqual(filter.defaultParams);
    }
    for (const sort of sorts.all()) {
      expect(typeof sort.label).toBe('string');
      expect(typeof sort.compare).toBe('function');
    }
  });
});
