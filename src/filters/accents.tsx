import type { Filter } from '@/core';
import { parseChoice } from '@/state/urlParams';
import { ChoiceGroup } from '@/ui/controls';

type Value = '' | 'with' | 'without';
interface Params {
  value: Value;
}

/** Prénoms avec ou sans accent (accent, tréma ou cédille dans la forme affichée). */
const accents: Filter<Params> = {
  id: 'accents',
  label: 'Accents',
  group: 'Forme',
  defaultParams: { value: '' },
  isActive: (params) => params.value !== '',
  test: (entry, params) => (entry.derived.hasAccent === true) === (params.value === 'with'),
  Control: ({ value, onChange }) => (
    <ChoiceGroup
      legend="Accents"
      value={value.value}
      onChange={(next) => onChange({ value: next })}
      options={[
        { value: '', label: 'Tous' },
        { value: 'with', label: 'Avec accent' },
        { value: 'without', label: 'Sans accent' },
      ]}
    />
  ),
  toUrl: (params) => params.value,
  fromUrl: (value) => ({ value: parseChoice<Value>(value, ['with', 'without'], '') }),
};

export default accents;
