import type { NameEntry } from '@/core';
import { normalizeName } from '@/core';
import femaleShare from './femaleShare';
import hasAccent from './hasAccent';
import initial from './initial';
import isCompound from './isCompound';
import isMixed, { MIXED_MIN_SHARE } from './isMixed';
import length from './length';
import vowelCount from './vowelCount';

const entry = (label: string, female = 0, male = 0): NameEntry => ({
  id: normalizeName(label),
  label,
  derived: {},
  facts: { insee: { total: female + male, female, male } },
});

describe('champs calculés', () => {
  it('length compte les lettres, sans tiret, espace ni apostrophe', () => {
    expect(length.compute(entry('Léa'))).toBe(3);
    expect(length.compute(entry('Jean-Baptiste'))).toBe(12);
    expect(length.compute(entry('Marie Ange'))).toBe(9);
    expect(length.compute(entry("N'Golo"))).toBe(5);
  });

  it('initial donne la première lettre en majuscule, sans accent', () => {
    expect(initial.compute(entry('Élodie'))).toBe('E');
    expect(initial.compute(entry('zoé'))).toBe('Z');
  });

  it('vowelCount compte a, e, i, o, u, y sans tenir compte des accents', () => {
    expect(vowelCount.compute(entry('Léa'))).toBe(2);
    expect(vowelCount.compute(entry('Yves'))).toBe(2);
    expect(vowelCount.compute(entry('Anaïs'))).toBe(3);
  });

  it('isCompound repère un tiret ou un espace', () => {
    expect(isCompound.compute(entry('Jean-Baptiste'))).toBe(true);
    expect(isCompound.compute(entry('Marie Ange'))).toBe(true);
    expect(isCompound.compute(entry("N'Golo"))).toBe(false);
    expect(isCompound.compute(entry('Léa'))).toBe(false);
  });

  it('hasAccent repère accents, trémas et cédilles de la forme affichée', () => {
    expect(hasAccent.compute(entry('Léa'))).toBe(true);
    expect(hasAccent.compute(entry('Noël'))).toBe(true);
    expect(hasAccent.compute(entry('François'))).toBe(true);
    expect(hasAccent.compute(entry('Lea'))).toBe(false);
  });

  it('femaleShare donne la part féminine et requiert la source insee', () => {
    expect(femaleShare.requires).toEqual(['insee']);
    expect(femaleShare.compute(entry('Camille', 50, 15))).toBeCloseTo(50 / 65);
    expect(femaleShare.compute(entry('Léa', 18, 0))).toBe(1);
    expect(femaleShare.compute(entry('Vide', 0, 0))).toBe(0);
  });

  it('isMixed exige au moins 20 % de chaque sexe', () => {
    expect(MIXED_MIN_SHARE).toBe(0.2);
    expect(isMixed.requires).toEqual(['insee']);
    expect(isMixed.compute(entry('Camille', 50, 50))).toBe(true);
    expect(isMixed.compute(entry('Limite', 20, 80))).toBe(true);
    expect(isMixed.compute(entry('Limite', 80, 20))).toBe(true);
    expect(isMixed.compute(entry('Presque', 19, 81))).toBe(false);
    expect(isMixed.compute(entry('Léa', 100, 0))).toBe(false);
  });
});
