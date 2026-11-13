import type { Filter } from '@/core';
import { ToggleGroup } from '@/ui/controls';

interface Params {
  /** Initiales retenues, en majuscules, triées. */
  letters: string[];
}

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const clean = (letters: string[]) =>
  [...new Set(letters.map((letter) => letter.toUpperCase()))]
    .filter((letter) => ALPHABET.includes(letter))
    .sort();

/** Une ou plusieurs initiales (accents ignorés : « Élodie » est en E). */
const initial: Filter<Params> = {
  id: 'initial',
  label: 'Initiale',
  group: 'Texte',
  defaultParams: { letters: [] },
  isActive: (params) => params.letters.length > 0,
  test: (entry, params) => params.letters.includes(entry.derived.initial as string),
  Control: ({ value, onChange }) => (
    <ToggleGroup
      legend="Initiales"
      compact
      options={ALPHABET.map((letter) => ({ value: letter, label: letter }))}
      selected={value.letters}
      onToggle={(letter) =>
        onChange({
          letters: value.letters.includes(letter)
            ? value.letters.filter((item) => item !== letter)
            : clean([...value.letters, letter]),
        })
      }
    />
  ),
  toUrl: (params) => clean(params.letters).join(''),
  fromUrl: (value) => ({ letters: clean(value.split('')) }),
};

export default initial;
