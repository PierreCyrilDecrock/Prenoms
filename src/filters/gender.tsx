import type { Filter } from '@/core';
import { MIXED_MIN_SHARE } from '@/derived/isMixed';
import { INSEE_SOURCE_ID } from '@/sources/insee/facts';
import { parseChoice } from '@/state/urlParams';
import { ChoiceGroup } from '@/ui/controls';

type Value = '' | 'm' | 'f' | 'x';
interface Params {
  value: Value;
}

/**
 * Sexe d'attribution, d'après la part féminine (femaleShare) :
 * mixte si chaque sexe atteint 20 %, sinon garçons ou filles.
 */
const gender: Filter<Params> = {
  id: 'gender',
  label: 'Sexe et mixité',
  group: 'Popularité',
  requires: [INSEE_SOURCE_ID],
  defaultParams: { value: '' },
  isActive: (params) => params.value !== '',
  test: (entry, params) => {
    const share = entry.derived.femaleShare as number;
    if (params.value === 'm') return share < MIXED_MIN_SHARE;
    if (params.value === 'f') return share > 1 - MIXED_MIN_SHARE;
    return share >= MIXED_MIN_SHARE && share <= 1 - MIXED_MIN_SHARE;
  },
  describe: (params) => ({ '': '', f: 'filles', m: 'garçons', x: 'mixtes' })[params.value],
  Control: ({ value, onChange }) => (
    <ChoiceGroup
      legend="Prénoms donnés"
      value={value.value}
      onChange={(next) => onChange({ value: next })}
      options={[
        { value: '', label: 'Tous' },
        { value: 'f', label: 'Filles' },
        { value: 'm', label: 'Garçons' },
        { value: 'x', label: 'Mixtes' },
      ]}
    />
  ),
  toUrl: (params) => params.value,
  fromUrl: (value) => ({ value: parseChoice<Value>(value, ['m', 'f', 'x'], '') }),
};

export default gender;
