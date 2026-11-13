import type { Filter } from '@/core';
import {
  birthsBetween,
  getInseeFacts,
  getInseeYearRange,
  INSEE_SOURCE_ID,
} from '@/sources/insee/facts';
import { parseInteger } from '@/state/urlParams';
import { FieldRow, NumberField } from '@/ui/controls';

interface Params {
  /** Minimum de naissances sur la période ; null = filtre inactif. */
  min: number | null;
  /** Bornes incluses ; null = début ou fin des données. */
  from: number | null;
  to: number | null;
}

/** Minimum de naissances sur une période (année de début et de fin incluses). */
const periodPopularity: Filter<Params> = {
  id: 'periodPopularity',
  label: 'Popularité sur une période',
  group: 'Popularité',
  requires: [INSEE_SOURCE_ID],
  defaultParams: { min: null, from: null, to: null },
  isActive: (params) => params.min !== null && params.min > 0,
  test: (entry, params) => {
    const facts = getInseeFacts(entry);
    if (!facts) return false;
    const births = birthsBetween(facts, params.from ?? -Infinity, params.to ?? Infinity);
    return births >= (params.min ?? 0);
  },
  describe: (params) => {
    const years = getInseeYearRange();
    const min = (params.min ?? 0).toLocaleString('fr-FR');
    return `au moins ${min} entre ${params.from ?? years.min} et ${params.to ?? years.max}`;
  },
  Control: ({ value, onChange }) => {
    const years = getInseeYearRange();
    return (
      <div className="flex flex-col gap-2">
        <NumberField
          label="Naissances min. sur la période"
          value={value.min}
          onChange={(min) => onChange({ ...value, min })}
          placeholder="ex. 500"
        />
        <FieldRow>
          <NumberField
            label="De l’année"
            value={value.from}
            min={years.min}
            max={years.max}
            placeholder={String(years.min)}
            onChange={(from) => onChange({ ...value, from })}
          />
          <NumberField
            label="À l’année"
            value={value.to}
            min={years.min}
            max={years.max}
            placeholder={String(years.max)}
            onChange={(to) => onChange({ ...value, to })}
          />
        </FieldRow>
      </div>
    );
  },
  toUrl: (params) => `${params.min ?? ''}@${params.from ?? ''}-${params.to ?? ''}`,
  fromUrl: (value) => {
    const match = /^(\d*)@(\d*)-(\d*)$/.exec(value);
    if (!match) return periodPopularity.defaultParams;
    return {
      min: parseInteger(match[1]),
      from: parseInteger(match[2]),
      to: parseInteger(match[3]),
    };
  },
};

export default periodPopularity;
