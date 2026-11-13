import type { Filter } from '@/core';
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

/** Nombre de lettres, minimum et maximum inclus. */
const length: Filter<NumberRange> = {
  id: 'length',
  label: 'Longueur',
  group: 'Forme',
  defaultParams: EMPTY_RANGE,
  isActive: isRangeActive,
  test: (entry, params) => inRange(entry.derived.length as number, params),
  describe: (params) => describeRange(params, 'lettres'),
  Control: ({ value, onChange }) => (
    <FieldRow>
      <NumberField
        label="Lettres min."
        value={value.min}
        min={1}
        onChange={(min) => onChange({ ...value, min })}
      />
      <NumberField
        label="Lettres max."
        value={value.max}
        min={1}
        onChange={(max) => onChange({ ...value, max })}
      />
    </FieldRow>
  ),
  toUrl: formatRange,
  fromUrl: parseRange,
};

export default length;
