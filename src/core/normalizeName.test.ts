import { normalizeName } from './normalizeName';

describe('normalizeName', () => {
  it('retire les accents, la cédille et les ligatures', () => {
    expect(normalizeName('Léa')).toBe('lea');
    expect(normalizeName('Noël')).toBe('noel');
    expect(normalizeName('Anaïs')).toBe('anais');
    expect(normalizeName('François')).toBe('francois');
    expect(normalizeName('Cœur')).toBe('coeur');
    expect(normalizeName('Lætitia')).toBe('laetitia');
  });

  it('traite de la même façon les accents composés et décomposés', () => {
    expect(normalizeName('Léa')).toBe(normalizeName('Léa'));
  });

  it('met en minuscules, y compris les majuscules accentuées', () => {
    expect(normalizeName('MARIE')).toBe('marie');
    expect(normalizeName('ÉLODIE')).toBe('elodie');
    expect(normalizeName('lea')).toBe(normalizeName('LÉA'));
  });

  it('conserve le tiret et unifie ses variantes', () => {
    expect(normalizeName('Jean-Baptiste')).toBe('jean-baptiste');
    expect(normalizeName('Jean–Baptiste')).toBe('jean-baptiste');
    expect(normalizeName('Jean - Baptiste')).toBe('jean-baptiste');
    expect(normalizeName('Jean--Baptiste')).toBe('jean-baptiste');
    expect(normalizeName('Jean-Baptiste')).not.toBe(normalizeName('Jean Baptiste'));
  });

  it("conserve l'apostrophe et unifie ses variantes", () => {
    expect(normalizeName("N'Golo")).toBe("n'golo");
    expect(normalizeName('N’Golo')).toBe("n'golo");
    expect(normalizeName("N' Golo")).toBe("n'golo");
  });

  it('supprime les espaces superflus', () => {
    expect(normalizeName('  Marie   Claire ')).toBe('marie claire');
    expect(normalizeName('Marie\t Claire')).toBe('marie claire');
    expect(normalizeName('   ')).toBe('');
  });

  it('est idempotente', () => {
    for (const name of ['Léa', ' Jean - Baptiste ', 'N’Golo', 'MARIE  CLAIRE']) {
      expect(normalizeName(normalizeName(name))).toBe(normalizeName(name));
    }
  });
});
