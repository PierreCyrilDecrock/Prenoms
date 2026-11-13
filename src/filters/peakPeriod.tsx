import type { Filter } from '@/core';
import { getInseeFacts, getInseeYearRange, INSEE_SOURCE_ID } from '@/sources/insee/facts';
import {
  describeRange,
  EMPTY_RANGE,
  formatRange,
  inRange,
  isRangeActive,
  parseRange,
  type NumberRange,
} from '@/state/urlParams';
import { FieldRow, NumberField, ToggleGroup } from '@/ui/controls';

/** Année du pic comprise entre deux années incluses, avec raccourcis par décennie. */
const peakPeriod: Filter<NumberRange> = {
  id: 'peakPeriod',
  label: 'Année du pic',
  group: 'Chronologie',
  requires: [INSEE_SOURCE_ID],
  defaultParams: EMPTY_RANGE,
  isActive: isRangeActive,
  test: (entry, params) => {
    const facts = getInseeFacts(entry);
    return facts !== undefined && inRange(facts.peakYear, params);
  },
  describe: (params) => describeRange(params, '', String),
  Control: ({ value, onChange }) => {
    const years = getInseeYearRange();
    const decades: number[] = [];
    for (let decade = Math.floor(years.min / 10) * 10; decade <= years.max; decade += 10) {
      decades.push(decade);
    }
    const selected = decades.filter((decade) => value.min === decade && value.max === decade + 9);
    return (
      <div className="flex flex-col gap-2">
        <FieldRow>
          <NumberField
            label="Pic à partir de"
            value={value.min}
            min={years.min}
            max={years.max}
            placeholder={String(years.min)}
            onChange={(min) => onChange({ ...value, min })}
          />
          <NumberField
            label="Pic jusqu’à"
            value={value.max}
            min={years.min}
            max={years.max}
            placeholder={String(years.max)}
            onChange={(max) => onChange({ ...value, max })}
          />
        </FieldRow>
        <ToggleGroup
          legend="Décennie du pic"
          options={decades.map((decade) => ({ value: String(decade), label: `${decade}` }))}
          selected={selected.map(String)}
          onToggle={(decade) =>
            onChange(
              selected.includes(Number(decade))
                ? EMPTY_RANGE
                : { min: Number(decade), max: Number(decade) + 9 },
            )
          }
        />
      </div>
    );
  },
  toUrl: formatRange,
  fromUrl: parseRange,
};

export default peakPeriod;
