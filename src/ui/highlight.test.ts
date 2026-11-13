import { highlightRange } from './highlight';

const marked = (label: string, search: string, mode: 'startsWith' | 'contains' | 'endsWith') => {
  const range = highlightRange(label, search, mode);
  return range ? label.slice(range[0], range[1]) : null;
};

describe('highlightRange', () => {
  it('repère le début, le milieu ou la fin selon le mode', () => {
    expect(marked('Marie', 'mar', 'startsWith')).toBe('Mar');
    expect(marked('Marie', 'ri', 'contains')).toBe('ri');
    expect(marked('Marie', 'ie', 'endsWith')).toBe('ie');
  });

  it('ignore la casse et les accents, et rend la graphie d’origine', () => {
    expect(marked('Léa', 'LEA', 'startsWith')).toBe('Léa');
    expect(marked('Anaëlle', 'ael', 'contains')).toBe('aël');
    expect(marked('Noël', 'él', 'endsWith')).toBe('ël');
  });

  it('gère les tirets, espaces et apostrophes', () => {
    expect(marked('Jean-Baptiste', 'n-b', 'contains')).toBe('n-B');
    expect(marked('Marie Ange', 'e a', 'contains')).toBe('e A');
    expect(marked("N'Golo", "n'g", 'startsWith')).toBe("N'G");
  });

  it('renvoie null sans correspondance ou sans recherche', () => {
    expect(marked('Marie', 'ri', 'startsWith')).toBeNull();
    expect(marked('Marie', 'x', 'contains')).toBeNull();
    expect(marked('Marie', '  ', 'contains')).toBeNull();
  });
});
