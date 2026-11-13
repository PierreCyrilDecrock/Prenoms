import { filters, runQuery, sorts, type NameEntry } from '@/core';
import demoSyllables from './demoSyllables';

const entry = (id: string, syllables?: number): NameEntry => ({
  id,
  label: id,
  derived: {},
  facts: syllables === undefined ? {} : { demo: { origin: 'grecque', syllables } },
});
const entries = [entry('gabriel', 3), entry('jean', 1), entry('autre'), entry('lea', 2)];

const order = (direction: 'asc' | 'desc', loadedSources = ['demo']) =>
  runQuery(entries, { sortId: demoSyllables.id, direction }, { filters, sorts, loadedSources }).map(
    (item) => item.id,
  );

describe('demoSyllables', () => {
  it('trie par nombre de syllabes, dans les deux sens', () => {
    expect(order('asc')).toEqual(['autre', 'jean', 'lea', 'gabriel']);
    expect(order('desc')).toEqual(['gabriel', 'lea', 'jean', 'autre']);
  });

  it('est ignoré tant que la source demo n’est pas chargée', () => {
    expect(order('asc', [])).toEqual(entries.map((item) => item.id));
  });
});
