# Ajouter un filtre

Un filtre restreint la liste des prénoms selon des paramètres choisis dans l'interface. Il tient
dans un seul fichier : le registre des filtres le découvre, puis le panneau de filtres, les
pastilles, l'adresse partageable et le moteur de requête s'en servent. **Ni `src/core` ni `src/ui`
ne changent.**

## Fichiers à créer

| Fichier                     | Rôle                                                 |
| --------------------------- | ---------------------------------------------------- |
| `src/filters/<id>.tsx`      | Le filtre : un objet `Filter<P>` en `export default` |
| `src/filters/<id>.test.tsx` | Les tests du filtre                                  |

Tout fichier `.tsx` de `src/filters/` qui n'est pas un test est pris pour un filtre : le code
partagé entre filtres vit ailleurs (`src/ui/controls.tsx`, `src/state/urlParams.ts`).

## Contrat

```ts
// src/core/filter.ts (extrait)
interface Filter<P> {
  id: string; // unique ; apparaît dans l'adresse : f.<id>=…
  label: string; // titre du filtre dans le panneau et la pastille
  group: string; // groupe du panneau (Texte, Popularité, Chronologie, Forme, Favoris…)
  requires?: string[]; // ids des sources lues
  defaultParams: P; // valeur qui ne filtre rien
  isActive(params: P): boolean; // faux pour defaultParams
  test(entry: NameEntry, params: P): boolean; // vrai pour garder le prénom
  describe?(params: P): string; // texte court de la pastille, ex. « filles »
  Control: ComponentType<{ value: P; onChange(params: P): void }>;
  toUrl(params: P): string;
  fromUrl(value: string): P; // ne lève jamais
}
```

## Règles

1. **`id` stable.** Il figure dans les liens partagés (`#/?f.<id>=…`) : le changer casse ces liens.
2. **`group`.** Un nom de groupe nouveau crée un nouveau groupe dans le panneau.
3. **`defaultParams` et `isActive`.** `isActive(defaultParams)` est faux. Un filtre inactif n'est
   ni appliqué, ni écrit dans l'adresse, ni affiché en pastille.
4. **`test` ne lève jamais.** Un prénom peut ne pas avoir les faits de la source lue (il vient
   d'une autre source) : le traiter explicitement.
5. **`requires`.** Déclarer chaque source dont le filtre lit les faits. Tant qu'elle n'est pas
   chargée, le filtre est masqué et ignoré.
6. **Adresse.** `toUrl` produit un texte court ; `fromUrl(toUrl(p))` redonne exactement `p` ;
   `fromUrl` renvoie `defaultParams` pour toute valeur invalide (aides : `parseChoice`,
   `parseRange`, `formatRange` de `@/state/urlParams`).
7. **Contrôle.** Composant contrôlé (il reçoit `value` et appelle `onChange`). Utiliser les briques
   de `@/ui/controls` : `TextField`, `NumberField`, `ChoiceGroup`, `ToggleGroup` (libellés
   accessibles, cibles tactiles de 44 px).
8. **Performance.** `test` est appelé pour chacun des 32 000 prénoms à chaque frappe : pas de
   calcul coûteux par appel ; préparer une fois par jeu de paramètres (voir `letters.tsx`).

## Exemple complet : filtre « Origine (démo) »

Il lit `facts.demo`, fourni par la source décrite dans [ajouter une source](ajouter-une-source.md).

Fichier `src/filters/demoOrigin.tsx` :

```tsx
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
```

Fichier `src/filters/demoOrigin.test.tsx` :

```tsx
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
```

## Ce qui fonctionne sans autre modification

- le filtre apparaît dans son groupe, dans le tiroir (téléphone) et la barre latérale (ordinateur) ;
- une pastille le résume quand il est actif, avec le texte de `describe` ;
- il est écrit dans l'adresse (`#/?f.demoOrigin=grecque`) et un lien partagé le restaure ;
- la page `#/dev` (étape 6) l'affiche avec son effet sur le nombre de résultats ;
- les tests génériques (`src/core/registries.test.ts`, `src/filters/filters.test.tsx`,
  `src/state/urlState.test.ts`) vérifient son contrat : aller-retour d'adresse, valeurs invalides,
  affichage du contrôle.

## Vérifier

```bash
npm run lint && npm test && npm run build
git add -A && git diff --cached --stat   # seul src/filters/ apparaît
```
