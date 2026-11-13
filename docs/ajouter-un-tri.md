# Ajouter un tri

Un tri ordonne la liste des prénoms. Il tient dans un seul fichier : le registre des tris le
découvre, puis le sélecteur de tri, l'adresse partageable et le moteur de requête s'en servent.
**Ni `src/core` ni `src/ui` ne changent.**

## Fichiers à créer

| Fichier                  | Rôle                                         |
| ------------------------ | -------------------------------------------- |
| `src/sorts/<id>.ts`      | Le tri : un objet `Sort` en `export default` |
| `src/sorts/<id>.test.ts` | Les tests du tri                             |

## Contrat

```ts
// src/core/types.ts (extrait)
interface Sort {
  id: string; // unique ; apparaît dans l'adresse : s=<id>
  label: string; // libellé du sélecteur de tri
  requires?: string[]; // ids des sources lues
  compare(a: NameEntry, b: NameEntry): number; // ordre croissant
}
```

## Règles

1. **`compare` décrit l'ordre croissant** : négatif si `a` vient avant `b`, positif après, zéro à
   égalité. Le sens (croissant ou décroissant) est appliqué par le moteur de requête.
2. **Égalités.** Ne pas départager soi-même : le moteur classe les ex æquo par ordre alphabétique,
   quel que soit le sens, ce qui rend le résultat stable.
3. **Cohérence.** `compare(a, a)` vaut 0 et `compare(a, b)` est l'opposé de `compare(b, a)`.
4. **Faits absents.** Un prénom peut ne pas avoir les faits de la source lue : lui donner une
   valeur par défaut (souvent 0) pour qu'il soit classé avec les autres prénoms sans données.
5. **`requires`.** Déclarer chaque source lue. Tant qu'elle n'est pas chargée, le tri est masqué
   du sélecteur et ignoré.
6. **`id` stable.** Il figure dans les liens partagés (`#/?s=<id>&d=asc`).
7. **Performance.** Trier 32 000 prénoms appelle `compare` plusieurs centaines de milliers de
   fois : lire des valeurs déjà calculées, sans créer d'objet.

## Exemple complet : tri « Syllabes (démo) »

Il lit `facts.demo`, fourni par la source décrite dans [ajouter une source](ajouter-une-source.md).

Fichier `src/sorts/demoSyllables.ts` :

```ts
import type { Sort } from '@/core';
import { DEMO_SOURCE_ID, getDemoFacts } from '@/sources/demo/facts';

/** Nombre de syllabes ; un prénom absent de la source démo compte 0. */
const demoSyllables: Sort = {
  id: 'demoSyllables',
  label: 'Syllabes (démo)',
  requires: [DEMO_SOURCE_ID],
  compare: (a, b) => (getDemoFacts(a)?.syllables ?? 0) - (getDemoFacts(b)?.syllables ?? 0),
};

export default demoSyllables;
```

Fichier `src/sorts/demoSyllables.test.ts` :

```ts
import { filters, runQuery, sorts, type NameEntry } from '@/core';
import demoSyllables from './demoSyllables';

const entry = (id: string, syllables?: number): NameEntry => ({
  id,
  label: id,
  derived: {},
  facts: syllables === undefined ? {} : { demo: { origin: 'grecque', syllables } },
});
const entries = [entry('gabriel', 3), entry('jean', 1), entry('autre'), entry('lea', 2)];

const order = (direction: 'asc' | 'desc', loadedSources = ['demo']) =>
  runQuery(entries, { sortId: demoSyllables.id, direction }, { filters, sorts, loadedSources }).map(
    (item) => item.id,
  );

describe('demoSyllables', () => {
  it('trie par nombre de syllabes, dans les deux sens', () => {
    expect(order('asc')).toEqual(['autre', 'jean', 'lea', 'gabriel']);
    expect(order('desc')).toEqual(['gabriel', 'lea', 'jean', 'autre']);
  });

  it('est ignoré tant que la source demo n’est pas chargée', () => {
    expect(order('asc', [])).toEqual(entries.map((item) => item.id));
  });
});
```

## Ce qui fonctionne sans autre modification

- le tri apparaît dans le sélecteur « Trier par », avec le bouton de sens ;
- il est écrit dans l'adresse (`#/?s=demoSyllables&d=desc`) et un lien partagé le restaure ;
- la page `#/dev` (étape 7) le propose avec les 20 premiers résultats ;
- le test générique `src/core/registries.test.ts` vérifie qu'il respecte le contrat.

## Vérifier

```bash
npm run lint && npm test && npm run build
git add -A && git diff --cached --stat   # seul src/sorts/ apparaît
```
