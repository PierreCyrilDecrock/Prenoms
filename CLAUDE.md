# Explorateur de prénoms

## But

Application 100 % statique qui charge les prénoms de l'INSEE dans le navigateur et permet de
les rechercher, filtrer et trier, sur mobile comme sur desktop.

- Feuille de route complète : `docs/PLAN.md`
- Avancement : `PROGRESS.md`
- Site publié : https://pierrecyrildecrock.github.io/Prenoms/ (diagnostic : `#/dev`)

## Contraintes

- Aucun backend, aucune base de données : tout tourne dans le navigateur.
- Hébergement GitHub Pages sous le sous-chemin `/Prenoms/` : `base` de Vite vient de `VITE_BASE`,
  les chemins d'actifs passent par `import.meta.env.BASE_URL`, le routage est par hash (`#/`).
- TypeScript strict. Mobile d'abord (360 px), puis desktop.
- Données pré-agrégées au build (`data/raw/` → `public/data/`) ; le navigateur ne lit jamais le CSV brut.
- Animations : uniquement `transform` et `opacity`, durées 120–250 ms (350 ms max pour une page),
  `prefers-reduced-motion` respecté.

## Arborescence

```text
src/
  core/      types, registres, pipeline (aucune dépendance UI)
  sources/   un dossier par source (insee/)
  derived/   un fichier par champ calculé
  filters/   un fichier par filtre
  sorts/     un fichier par tri
  ui/        layout, liste, panneau de filtres, fiche prénom, page #/dev
  state/     store + sérialisation de l'URL
scripts/     build-data (CSV vers JSON)
data/raw/    fichiers sources bruts (ignorés par git, non publiés)
public/data/ JSON générés, publiés sur Pages
docs/        plan et guides d'extension
.github/workflows/deploy.yml
```

## Commandes

| Commande                | Effet                                                |
| ----------------------- | ---------------------------------------------------- |
| `npm run dev`           | Serveur de développement                             |
| `npm run build`         | Vérification des types puis build dans `dist/`       |
| `npm run preview`       | Sert `dist/` (ajouter `--base /Prenoms/` au build)   |
| `npm test`              | Tests Vitest + Testing Library                       |
| `npm run lint`          | ESLint + vérification Prettier                       |
| `npm run format`        | Formate avec Prettier                                |
| `npm run build:data`    | Régénère `public/data/insee.json` depuis `data/raw/` |
| `npm run validate:data` | Vérifie que les sommes du JSON égalent celles du CSV |

Test local sous sous-chemin : `VITE_BASE=/Prenoms/ npm run build && VITE_BASE=/Prenoms/ npm run preview`.

## Règle d'or

`src/core` ne dépend jamais d'une source, d'un filtre ou d'un tri précis (ESLint le vérifie).
On étend l'application en **ajoutant un fichier** dans `src/sources/`, `src/derived/`,
`src/filters/` ou `src/sorts/` ; les registres les découvrent avec `import.meta.glob`.
Ne modifie jamais `src/core` pour ajouter une source, un filtre ou un tri : si c'est inévitable,
dis-le clairement et corrige l'architecture plutôt que de la contourner.

Contrats (`src/core`, importés depuis `@/core`) : `NameEntry`, `DataSource`/`SourceData`,
`DerivedField`, `Filter<P>`, `Sort`, `normalizeName()`. Chaque fichier de module expose son objet
en `export default` avec un `id` unique ; un id manquant ou en double lève une `RegistryError` au
démarrage. Les fichiers `*.test.ts(x)` ne sont pas pris pour des modules. Les registres
(`sources`, `derivedFields`, `filters`, `sorts`) sont dans `src/core/registries.ts`.

Autres règles :

- Un prénom est identifié par sa forme normalisée (minuscules, sans accents).
- Chaque source range ses données sous sa propre clé dans `facts`.
- Un filtre ou un tri déclare les sources requises (`requires`).
- `src/ui` ne contient aucune logique métier.

## Données INSEE

- Source : fichier national `prenoms-2023-nat.csv` (naissances 1900–2023), téléchargé depuis
  https://www.insee.fr/fr/statistiques/8205621 et décompressé dans `data/raw/` (ignoré par git).
- `npm run build:data` écrit `public/data/insee.json` (format décrit dans
  `src/sources/insee/format.ts`) et `public/data/insee.report.json` (exclusions, tailles). Ces
  deux fichiers sont commités : le build en ligne ne régénère pas les données.
- Les lignes d'année inconnue (`XXXX`) et le regroupement `_PRENOMS_RARES` sont exclus et comptés
  dans le rapport. Les graphies qui ne diffèrent que par les accents (LEA, LÉA) sont fusionnées
  sous la plus fréquente.
- Les scripts s'exécutent avec Node 22 sans transpilation : leurs imports relatifs portent
  l'extension `.ts`.

## Chargement dans le navigateur

- `src/sources/insee/index.ts` lit d'abord `insee.report.json` (petit, jamais mis en cache HTTP),
  puis réutilise le cache IndexedDB si la version de format et la date de génération sont
  identiques ; sinon il télécharge `insee.json` et remplit le cache.
- Les faits d'un prénom sont typés par `InseeFacts` (`src/sources/insee/facts.ts`), avec les aides
  `getInseeFacts`, `birthsInYear` et `birthsBetween`.
- `src/state/namesStore.ts` (Zustand) charge toutes les sources au démarrage, les fusionne avec
  `mergeSources` (dans `src/core`) et expose `entries`, `status`, `error`, `loadedSources`.
- Un champ calculé qui lit une source déclare `requires` et importe ses types depuis le dossier
  de cette source.

## Moteur de requête

`runQuery(entries, query, context)` dans `src/core/query.ts` est une fonction pure : recherche
(`startsWith`, `contains`, `endsWith`, sur l'`id` normalisé), filtres actifs du registre, puis tri
avec départage alphabétique. `context` fournit les registres et `loadedSources` ; un filtre ou un
tri inconnu, inactif ou dont une source requise manque est ignoré. Les prédicats sont ordonnés du
plus sélectif au moins sélectif d'après un échantillon. Budget : moins de 100 ms pour 5 filtres
sur 50 000 entrées (testé).

## Jetons de design

Définis en variables CSS dans `src/index.css` et exposés à Tailwind par `@theme`
(`bg-surface`, `text-ink`, `text-ink-muted`, `bg-accent`, `bg-female`, `bg-male`, `rounded-card`,
`rounded-panel`, `duration-fast|base|slow|page`, `ease-soft`). Les durées et courbes pour Motion
sont dans `src/ui/tokens.ts`. Ne code jamais une couleur ou une durée en dur dans un composant.

## Protocole « étape suivante »

Quand l'utilisateur écrit « étape suivante », suis le chapitre « Mode d'emploi pour Claude Code »
de `docs/PLAN.md` :

1. Lis `docs/PLAN.md` et `PROGRESS.md` ; l'étape à faire est la première non terminée.
2. Relis la section de l'étape et ce fichier. N'anticipe jamais une étape suivante.
3. Annonce brièvement, puis exécute sans attendre de validation.
4. Lint, tests et build passent en local.
5. Ajoute une section « Étape N » à `#/dev` (`src/ui/DevPage.tsx`).
6. Commit sur `main` (`étape N : titre`), push, surveille le déploiement, vérifie que
   `<URL>/version.json` renvoie le SHA du commit (c'est celui affiché sur `#/dev`).
7. Mets à jour `PROGRESS.md`, commit, push.
8. Compte-rendu court, puis arrête-toi. Une seule étape par demande.

Autres commandes : « refais l'étape N : … » (corrige, redéploie, note dans `PROGRESS.md`) et
« où en est-on ? » (résume `PROGRESS.md` sans rien modifier).

Pas de `git push --force`, pas de suppression de branche, pas de réglage du dépôt hors GitHub
Pages sans demande explicite.
