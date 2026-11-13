import type { Filter } from '@/core';
import { getInseeFacts, INSEE_SOURCE_ID, TREND_WINDOW } from '@/sources/insee/facts';
import { parseChoice } from '@/state/urlParams';
import { ChoiceGroup } from '@/ui/controls';

type Value = '' | 'up' | 'down';
interface Params {
  value: Value;
}

/**
 * Tendance : compare les naissances des 10 dernières années de la source à celles
 * des 10 années précédentes. Un prénom absent des deux périodes n'a pas de tendance.
 */
const trend: Filter<Params> = {
  id: 'trend',
  label: 'Tendance',
  group: 'Chronologie',
  requires: [INSEE_SOURCE_ID],
  defaultParams: { value: '' },
  isActive: (params) => params.value !== '',
  test: (entry, params) => {
    const facts = getInseeFacts(entry);
    if (!facts) return false;
    return params.value === 'up' ? facts.recent > facts.previous : facts.recent < facts.previous;
  },
  Control: ({ value, onChange }) => (
    <ChoiceGroup
      legend={`Sur les ${TREND_WINDOW} dernières années, par rapport aux ${TREND_WINDOW} précédentes`}
      value={value.value}
      onChange={(next) => onChange({ value: next })}
      options={[
        { value: '', label: 'Toutes' },
        { value: 'up', label: 'En hausse' },
        { value: 'down', label: 'En baisse' },
      ]}
    />
  ),
  toUrl: (params) => params.value,
  fromUrl: (value) => ({ value: parseChoice<Value>(value, ['up', 'down'], '') }),
};

export default trend;
