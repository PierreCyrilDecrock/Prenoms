import type { Filter } from '@/core';
import { DEMO_ORIGINS, DEMO_SOURCE_ID, getDemoFacts, type DemoOrigin } from '@/sources/demo/facts';
import { parseChoice } from '@/state/urlParams';
import { ChoiceGroup } from '@/ui/controls';

type Value = '' | DemoOrigin;
interface Params {
  value: Value;
}

/** Origine du prénom, d'après la source démo. */
const demoOrigin: Filter<Params> = {
  id: 'demoOrigin',
  label: 'Origine (démo)',
  group: 'Démo',
  requires: [DEMO_SOURCE_ID],
  defaultParams: { value: '' },
  isActive: (params) => params.value !== '',
  // Un prénom absent de la source démo n'a pas d'origine : il est écarté.
  test: (entry, params) => getDemoFacts(entry)?.origin === params.value,
  describe: (params) => params.value,
  Control: ({ value, onChange }) => (
    <ChoiceGroup
      legend="Origine du prénom"
      value={value.value}
      onChange={(next) => onChange({ value: next })}
      options={[
        { value: '', label: 'Toutes' },
        ...DEMO_ORIGINS.map((origin) => ({ value: origin, label: origin })),
      ]}
    />
  ),
  toUrl: (params) => params.value,
  fromUrl: (value) => ({ value: parseChoice<Value>(value, DEMO_ORIGINS, '') }),
};

export default demoOrigin;
