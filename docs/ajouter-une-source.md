# Ajouter une source de données

Une source apporte des prénoms et des faits sur ces prénoms (effectifs, origine…). Elle vit dans
son propre dossier : le registre des sources la découvre au démarrage, l'application la charge
puis fusionne ses prénoms avec ceux des autres sources. **Ni `src/core` ni `src/ui` ne changent.**

## Fichiers à créer

| Fichier                          | Rôle                                                  |
| -------------------------------- | ----------------------------------------------------- |
| `src/sources/<id>/index.ts`      | La source : un objet `DataSource` en `export default` |
| `src/sources/<id>/facts.ts`      | Le type des faits, et une fonction pour les lire      |
| `src/sources/<id>/index.test.ts` | Les tests de la source                                |

Si les données sont volumineuses ou doivent être préparées, ajouter aussi :

| Fichier                 | Rôle                                                         |
| ----------------------- | ------------------------------------------------------------ |
| `scripts/build-<id>.ts` | Transforme les fichiers bruts de `data/raw/` en JSON compact |
| `public/data/<id>.json` | Le JSON généré, commité et publié avec le site               |

Rien d'autre : aucun registre à compléter, aucun import à ajouter ailleurs.

## Contrat

```ts
// src/core/types.ts (extrait)
interface DataSource {
  id: string; // identifiant unique, et clé des faits : facts.<id>
  label: string; // nom affiché (page #/dev)
  load(onProgress?: (progress: number) => void): Promise<SourceData>; // progression de 0 à 1
  clearCache?(): Promise<void>; // seulement si la source garde un cache local
}

interface SourceData {
  records: SourceRecord[];
  meta?: Record<string, unknown>; // informations libres (version, cache…)
}

interface SourceRecord {
  label: string; // forme d'affichage, ex. « Léa »
  facts: unknown; // faits de cette source pour ce prénom
}
```

## Règles

1. **`id` unique et stable.** Il nomme la clé `facts.<id>` et sert dans le `requires` des filtres
   et des tris qui lisent ces faits.
2. **L'identifiant d'un prénom est calculé par le cœur**, avec `normalizeName(label)` (minuscules,
   sans accents). « Léa » et « LEA » venant de deux sources désignent le même prénom.
3. **Fusion sans écrasement.** Un prénom déjà connu reçoit seulement `facts.<id>` ; un prénom
   inconnu des autres sources devient une nouvelle entrée. Quand plusieurs sources fournissent le
   même prénom, la forme affichée est celle de la première source, dans l'ordre alphabétique des
   dossiers (`demo` passe avant `insee`) : fournir une forme d'affichage soignée (« Léa », pas
   « LEA »).
4. **Imports.** Dans `src/sources/<id>/`, n'importer de `@/core` que des types (`import type`).
   Pour une fonction, importer son fichier (`@/core/slices`, `@/core/normalizeName`) : `@/core`
   charge les registres, qui chargent les sources, et cet import circulaire laisserait la source
   sans `id` au démarrage.
5. **Données à télécharger.** Les placer dans `public/data/` et construire l'adresse avec
   `import.meta.env.BASE_URL` (le site est servi sous `/Prenoms/`). Un traitement long se découpe
   avec `runInSlices` (`@/core/slices`) pour ne pas figer l'interface ; voir la source `insee`.
6. **Chargement.** Toutes les sources se chargent au démarrage, en parallèle. Si l'une échoue,
   l'application affiche une erreur avec un bouton « Réessayer ».

## Exemple complet : la source « demo »

Une dizaine de prénoms écrits en dur, avec une origine et un nombre de syllabes (valeurs
d'illustration).

Fichier `src/sources/demo/facts.ts` :

```ts
import type { NameEntry } from '@/core';

export const DEMO_SOURCE_ID = 'demo';

export const DEMO_ORIGINS = ['germanique', 'grecque', 'hébraïque'] as const;
export type DemoOrigin = (typeof DEMO_ORIGINS)[number];

/** Faits de la source démo pour un prénom, rangés sous facts.demo. */
export interface DemoFacts {
  /** Origine du prénom (valeur d'illustration). */
  origin: DemoOrigin;
  /** Nombre de syllabes à l'oral. */
  syllables: number;
}

/** Faits démo d'un prénom, ou undefined s'il ne vient pas de cette source. */
export function getDemoFacts(entry: NameEntry): DemoFacts | undefined {
  return entry.facts[DEMO_SOURCE_ID] as DemoFacts | undefined;
}
```

Fichier `src/sources/demo/index.ts` :

```ts
import type { DataSource } from '@/core';
import { DEMO_SOURCE_ID, type DemoFacts } from './facts';

/** Prénoms écrits en dur : [forme d'affichage, origine, syllabes]. */
const NAMES: [string, DemoFacts['origin'], number][] = [
  ['Marie', 'hébraïque', 2],
  ['Jean', 'hébraïque', 1],
  ['Léa', 'hébraïque', 2],
  ['Louis', 'germanique', 2],
  ['Emma', 'germanique', 2],
  ['Gabriel', 'hébraïque', 3],
  ['Chloé', 'grecque', 2],
  ['Hugo', 'germanique', 2],
  ['Inès', 'grecque', 2],
  ['Nathan', 'hébraïque', 2],
];

/** Source « demo » : une dizaine de prénoms avec une origine et un nombre de syllabes. */
const demo: DataSource = {
  id: DEMO_SOURCE_ID,
  label: 'Démo (données d’illustration)',
  async load(onProgress) {
    onProgress?.(1);
    return {
      records: NAMES.map(([label, origin, syllables]) => {
        const facts: DemoFacts = { origin, syllables };
        return { label, facts };
      }),
      meta: { count: NAMES.length },
    };
  },
};

export default demo;
```

Fichier `src/sources/demo/index.test.ts` :

```ts
import { mergeSources } from '@/core';
import { getDemoFacts } from './facts';
import demo from './index';

describe('source demo', () => {
  it('fournit une dizaine de prénoms et signale la fin du chargement', async () => {
    const onProgress = vi.fn();
    const data = await demo.load(onProgress);
    expect(data.records).toHaveLength(10);
    expect(onProgress).toHaveBeenLastCalledWith(1);
  });

  it('range ses faits sous facts.demo, fusionnés par forme normalisée', async () => {
    const other = { id: 'autre', data: { records: [{ label: 'LEA', facts: {} }] } };
    const entries = mergeSources([other, { id: demo.id, data: await demo.load() }], []);
    const lea = entries.find((entry) => entry.id === 'lea')!;
    expect(lea.facts).toEqual({ autre: {}, demo: { origin: 'hébraïque', syllables: 2 } });
    expect(getDemoFacts(lea)?.syllables).toBe(2);
  });
});
```

## Ce qui fonctionne sans autre modification

- les prénoms de la source apparaissent dans la liste, la recherche, les liens partagés et
  l'export (CSV : une colonne `<id>.<fait>` par fait simple ; JSON : tous les faits) ;
- la page `#/dev` liste la source, sa progression et son bloc `meta` ;
- les filtres et les tris qui déclarent `requires: ['<id>']` deviennent disponibles : voir
  [ajouter un filtre](ajouter-un-filtre.md) et [ajouter un tri](ajouter-un-tri.md).

## Limite actuelle

Les lignes de la liste et la fiche d'un prénom n'affichent que les statistiques de l'Insee
(`src/ui/inseeView.ts`). Y montrer les faits d'une nouvelle source demande aujourd'hui de modifier
`src/ui` : ce n'est pas encore un point d'extension. Un prénom présent uniquement dans la nouvelle
source s'affiche sans total ni courbe, en fin de liste quand le tri porte sur la popularité.

## Vérifier

```bash
npm run lint && npm test && npm run build
git add -A && git diff --cached --stat   # seuls src/sources/<id>/ (et scripts/, public/data/)
```
