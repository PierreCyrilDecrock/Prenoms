import { fireEvent, render, screen } from '@testing-library/react';
import type { NameEntry } from '@/core';
import demoOrigin from './demoOrigin';

const entry = (id: string, facts: NameEntry['facts']): NameEntry => ({
  id,
  label: id,
  derived: {},
  facts,
});
const lea = entry('lea', { demo: { origin: 'hébraïque', syllables: 2 } });
const hugo = entry('hugo', { demo: { origin: 'germanique', syllables: 2 } });
const camille = entry('camille', { insee: { total: 1 } });

describe('demoOrigin', () => {
  it('garde les prénoms de l’origine choisie et écarte ceux sans faits démo', () => {
    const kept = [lea, hugo, camille].filter((item) =>
      demoOrigin.test(item, { value: 'hébraïque' }),
    );
    expect(kept).toEqual([lea]);
  });

  it('est inactif par défaut et requiert la source demo', () => {
    expect(demoOrigin.isActive(demoOrigin.defaultParams)).toBe(false);
    expect(demoOrigin.requires).toEqual(['demo']);
  });

  it('sérialise son choix et ignore une valeur inconnue', () => {
    expect(demoOrigin.fromUrl(demoOrigin.toUrl({ value: 'grecque' }))).toEqual({
      value: 'grecque',
    });
    expect(demoOrigin.fromUrl('martienne')).toEqual(demoOrigin.defaultParams);
  });

  it('son contrôle change l’origine', () => {
    const onChange = vi.fn();
    render(<demoOrigin.Control value={demoOrigin.defaultParams} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('grecque'));
    expect(onChange).toHaveBeenCalledWith({ value: 'grecque' });
  });
});
