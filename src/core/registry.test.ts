import { createRegistry, RegistryError } from './registry';

interface Item {
  id: string;
  label: string;
}

describe('createRegistry', () => {
  it('enregistre les exports par défaut, dans l’ordre des chemins', () => {
    const registry = createRegistry<Item>('tri', {
      '../sorts/b.ts': { default: { id: 'b', label: 'B' } },
      '../sorts/a.ts': { default: { id: 'a', label: 'A' } },
    });
    expect(registry.kind).toBe('tri');
    expect(registry.all().map((item) => item.id)).toEqual(['a', 'b']);
    expect(registry.get('b')?.label).toBe('B');
    expect(registry.has('a')).toBe(true);
    expect(registry.has('z')).toBe(false);
    expect(registry.get('z')).toBeUndefined();
  });

  it('accepte un registre vide', () => {
    expect(createRegistry<Item>('tri', {}).all()).toEqual([]);
  });

  it('refuse un fichier sans export default', () => {
    expect(() => createRegistry<Item>('filtre', { '../filters/x.tsx': {} })).toThrow(RegistryError);
    expect(() => createRegistry<Item>('filtre', { '../filters/x.tsx': {} })).toThrow(
      /filtre invalide dans « \.\.\/filters\/x\.tsx ».*export default/,
    );
  });

  it.each([
    ['manquant', { label: 'X' }],
    ['vide', { id: '  ', label: 'X' }],
    ['non textuel', { id: 42, label: 'X' }],
  ])('refuse un id %s, en nommant le fichier', (_cas, module) => {
    expect(() =>
      createRegistry<Item>('source', { '../sources/x/index.ts': { default: module } }),
    ).toThrow(/source invalide dans « \.\.\/sources\/x\/index\.ts ».*id est manquante ou vide/);
  });

  it('refuse un id en double, en nommant les deux fichiers', () => {
    const modules = {
      '../sorts/a.ts': { default: { id: 'same', label: 'A' } },
      '../sorts/b.ts': { default: { id: 'same', label: 'B' } },
    };
    expect(() => createRegistry<Item>('tri', modules)).toThrow(RegistryError);
    expect(() => createRegistry<Item>('tri', modules)).toThrow(
      'Id tri en double : « same » est déclaré dans « ../sorts/a.ts » et dans « ../sorts/b.ts ».',
    );
  });
});
