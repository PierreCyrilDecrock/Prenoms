import type { Filter } from '@/core';
import { useFavoritesStore } from '@/state/favoritesStore';
import { parseChoice } from '@/state/urlParams';
import { ChoiceGroup } from '@/ui/controls';

type Value = '' | 'only';
interface Params {
  value: Value;
}

/** Favoris uniquement : les prénoms marqués d'un cœur sur cet appareil. */
const favorites: Filter<Params> = {
  id: 'favorites',
  label: 'Favoris',
  group: 'Favoris',
  defaultParams: { value: '' },
  isActive: (params) => params.value === 'only',
  test: (entry) => useFavoritesStore.getState().ids[entry.id] === true,
  describe: () => 'uniquement',
  Control: ({ value, onChange }) => (
    <ChoiceGroup
      legend="Prénoms affichés"
      value={value.value}
      onChange={(next) => onChange({ value: next })}
      options={[
        { value: '', label: 'Tous' },
        { value: 'only', label: 'Favoris uniquement' },
      ]}
    />
  ),
  toUrl: (params) => params.value,
  fromUrl: (value) => ({ value: parseChoice<Value>(value, ['only'], '') }),
};

export default favorites;
