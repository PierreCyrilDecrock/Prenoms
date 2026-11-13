import { normalizeName, type Filter } from '@/core';
import { FieldRow, TextField } from '@/ui/controls';

interface Params {
  /** Lettres qui doivent toutes figurer dans le prénom. */
  include: string;
  /** Lettres dont aucune ne doit figurer. */
  exclude: string;
}

/** Lettres distinctes, sans accents, en minuscules. */
const parse = (text: string) => [...new Set(normalizeName(text).replace(/[^a-z]/g, ''))];

/** Analyse chaque texte une seule fois par requête, pas une fois par prénom. */
const cache = new Map<string, string[]>();
function lettersOf(text: string): string[] {
  let result = cache.get(text);
  if (!result) {
    if (cache.size > 50) cache.clear();
    result = parse(text);
    cache.set(text, result);
  }
  return result;
}

/** Lettres incluses ou exclues (accents ignorés). */
const letters: Filter<Params> = {
  id: 'letters',
  label: 'Lettres',
  group: 'Texte',
  defaultParams: { include: '', exclude: '' },
  isActive: (params) => lettersOf(params.include).length + lettersOf(params.exclude).length > 0,
  test: (entry, params) =>
    lettersOf(params.include).every((letter) => entry.id.includes(letter)) &&
    !lettersOf(params.exclude).some((letter) => entry.id.includes(letter)),
  Control: ({ value, onChange }) => (
    <FieldRow>
      <TextField
        label="Doit contenir"
        value={value.include}
        onChange={(include) => onChange({ ...value, include })}
        placeholder="ex. ae"
      />
      <TextField
        label="Ne doit pas contenir"
        value={value.exclude}
        onChange={(exclude) => onChange({ ...value, exclude })}
        placeholder="ex. xy"
      />
    </FieldRow>
  ),
  toUrl: (params) => `${lettersOf(params.include).join('')}~${lettersOf(params.exclude).join('')}`,
  fromUrl: (value) => {
    const parts = value.split('~');
    if (parts.length !== 2) return letters.defaultParams;
    return { include: lettersOf(parts[0]!).join(''), exclude: lettersOf(parts[1]!).join('') };
  },
};

export default letters;
