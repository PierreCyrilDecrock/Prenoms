import type { Filter } from '@/core';
import { getInseeFacts, INSEE_SOURCE_ID } from '@/sources/insee/facts';
import {
  describeRange,
  EMPTY_RANGE,
  formatRange,
  inRange,
  isRangeActive,
  parseRange,
  type NumberRange,
} from '@/state/urlParams';
import { FieldRow, NumberField } from '@/ui/controls';

/** Naissances cumulées sur toute la période, minimum et maximum inclus. */
const totalPopularity: Filter<NumberRange> = {
  id: 'totalPopularity',
  label: 'Popularité totale',
  group: 'Popularité',
  requires: [INSEE_SOURCE_ID],
  defaultParams: EMPTY_RANGE,
  isActive: isRangeActive,
  test: (entry, params) => inRange(getInseeFacts(entry)?.total ?? 0, params),
  describe: (params) => describeRange(params, 'naissances'),
  Control: ({ value, onChange }) => (
    <FieldRow>
      <NumberField
        label="Naissances min."
        value={value.min}
        onChange={(min) => onChange({ ...value, min })}
        placeholder="ex. 1000"
      />
      <NumberField
        label="Naissances max."
        value={value.max}
        onChange={(max) => onChange({ ...value, max })}
      />
    </FieldRow>
  ),
  toUrl: formatRange,
  fromUrl: parseRange,
};

export default totalPopularity;
