import type { Filter } from '@/core';
import { parseChoice } from '@/state/urlParams';
import { ChoiceGroup } from '@/ui/controls';

type Value = '' | 'only' | 'exclude';
interface Params {
  value: Value;
}

/** Prénoms composés (tiret ou espace) : uniquement, ou exclus. */
const compound: Filter<Params> = {
  id: 'compound',
  label: 'Prénom composé',
  group: 'Forme',
  defaultParams: { value: '' },
  isActive: (params) => params.value !== '',
  test: (entry, params) => (entry.derived.isCompound === true) === (params.value === 'only'),
  Control: ({ value, onChange }) => (
    <ChoiceGroup
      legend="Prénoms composés"
      value={value.value}
      onChange={(next) => onChange({ value: next })}
      options={[
        { value: '', label: 'Tous' },
        { value: 'only', label: 'Composés uniquement' },
        { value: 'exclude', label: 'Sans les composés' },
      ]}
    />
  ),
  toUrl: (params) => params.value,
  fromUrl: (value) => ({ value: parseChoice<Value>(value, ['only', 'exclude'], '') }),
};

export default compound;
