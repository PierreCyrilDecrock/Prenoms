import {
  formatRange,
  inRange,
  isRangeActive,
  parseChoice,
  parseInteger,
  parseRange,
} from './urlParams';

describe('urlParams', () => {
  it('parseInteger accepte les entiers positifs seulement', () => {
    expect(parseInteger('42')).toBe(42);
    expect(parseInteger('0')).toBe(0);
    for (const bad of ['', '-1', '1.5', 'abc', '1e3', '12345678901', undefined]) {
      expect(parseInteger(bad)).toBeNull();
    }
  });

  it('formatRange et parseRange sont inverses', () => {
    for (const range of [
      { min: 3, max: 6 },
      { min: 3, max: null },
      { min: null, max: 6 },
      { min: null, max: null },
    ]) {
      expect(parseRange(formatRange(range))).toEqual(range);
    }
    expect(formatRange({ min: null, max: null })).toBe('');
    expect(parseRange('3-6-9')).toEqual({ min: null, max: null });
  });

  it('inRange et isRangeActive', () => {
    expect(inRange(5, { min: 5, max: 5 })).toBe(true);
    expect(inRange(4, { min: 5, max: null })).toBe(false);
    expect(inRange(6, { min: null, max: 5 })).toBe(false);
    expect(isRangeActive({ min: null, max: null })).toBe(false);
    expect(isRangeActive({ min: 0, max: null })).toBe(true);
  });

  it('parseChoice replie sur la valeur par défaut', () => {
    expect(parseChoice('b', ['a', 'b'], 'a')).toBe('b');
    expect(parseChoice('z', ['a', 'b'], 'a')).toBe('a');
  });
});
