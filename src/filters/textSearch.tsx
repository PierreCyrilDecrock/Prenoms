import { normalizeName, type Filter, type SearchMode } from '@/core';
import { parseChoice } from '@/state/urlParams';
import { ChoiceGroup, TextField } from '@/ui/controls';

interface Params {
  text: string;
  mode: SearchMode;
}

const MODES = ['startsWith', 'contains', 'endsWith'] as const;
const CODES: Record<SearchMode, string> = { startsWith: 's', contains: 'c', endsWith: 'e' };

/** Normalise le texte une seule fois par requête, pas une fois par prénom. */
let cached = { raw: '', normalized: '' };
function normalized(raw: string): string {
  if (cached.raw !== raw) cached = { raw, normalized: normalizeName(raw) };
  return cached.normalized;
}

/** Recherche texte dans le prénom, insensible à la casse et aux accents. */
const textSearch: Filter<Params> = {
  id: 'textSearch',
  label: 'Texte du prénom',
  group: 'Texte',
  defaultParams: { text: '', mode: 'startsWith' },
  isActive: (params) => normalized(params.text) !== '',
  test: (entry, params) => {
    const text = normalized(params.text);
    if (params.mode === 'contains') return entry.id.includes(text);
    if (params.mode === 'endsWith') return entry.id.endsWith(text);
    return entry.id.startsWith(text);
  },
  Control: ({ value, onChange }) => (
    <div className="flex flex-col gap-2">
      <TextField
        label="Texte"
        value={value.text}
        onChange={(text) => onChange({ ...value, text })}
        placeholder="ex. mar"
      />
      <ChoiceGroup
        legend="Position"
        value={value.mode}
        onChange={(mode) => onChange({ ...value, mode })}
        options={[
          { value: 'startsWith', label: 'Commence par' },
          { value: 'contains', label: 'Contient' },
          { value: 'endsWith', label: 'Finit par' },
        ]}
      />
    </div>
  ),
  toUrl: (params) => `${CODES[params.mode]}:${params.text}`,
  fromUrl: (value) => {
    const mode = MODES.find((item) => CODES[item] === value.charAt(0));
    if (!mode || value.charAt(1) !== ':') return textSearch.defaultParams;
    return { mode: parseChoice(mode, MODES, 'startsWith'), text: value.slice(2) };
  },
};

export default textSearch;
