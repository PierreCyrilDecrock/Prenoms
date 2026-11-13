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

| Commande                | Effet                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| `npm run dev`           | Serveur de développement                                                 |
| `npm run build`         | Vérification des types puis build dans `dist/`                           |
| `npm run preview`       | Sert `dist/` (ajouter `--base /Prenoms/` au build)                       |
| `npm test`              | Tests Vitest + Testing Library                                           |
| `npm run lint`          | ESLint + vérification Prettier                                           |
| `npm run format`        | Formate avec Prettier                                                    |
| `npm run e2e`           | Scénarios Playwright sur un build local (mobile et desktop)              |
| `npm run e2e:live`      | Les mêmes scénarios contre le site publié                                |
| `npm run lighthouse`    | Audit Lighthouse mobile du site publié (`CHROME_PATH` requis)            |
| `npm run capture`       | Régénère icônes, image d'aperçu et captures du README (site local lancé) |
| `npm run build:data`    | Régénère `public/data/insee.json` depuis `data/raw/`                     |
| `npm run validate:data` | Vérifie que les sommes du JSON égalent celles du CSV                     |

Test local sous sous-chemin : `VITE_BASE=/Prenoms/ npm run build && VITE_BASE=/Prenoms/ npm run preview`.

## Règle d'or

`src/core` ne dépend jamais d'une source, d'un filtre ou d'un tri précis (ESLint le vérifie).
On étend l'application en **ajoutant un fichier** dans `src/sources/`, `src/derived/`,
`src/filters/` ou `src/sorts/` ; les registres les découvrent avec `import.meta.glob`.
Ne modifie jamais `src/core` pour ajouter une source, un filtre ou un tri : si c'est inévitable,
dis-le clairement et corrige l'architecture plutôt que de la contourner.

Guides d'extension (à suivre pour toute évolution) : `docs/ajouter-une-source.md`,
`docs/ajouter-un-filtre.md`, `docs/ajouter-un-tri.md`. Leurs exemples ont été vérifiés en les
recopiant tels quels à l'étape 13 : les garder compilables si un contrat change.

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

## Filtres

Les 11 filtres de la v1 sont dans `src/filters/` (un fichier `.tsx` chacun, tests regroupés dans
`filters.test.tsx`), répartis dans les groupes Texte, Popularité, Chronologie et Forme. Tout
fichier `.tsx` de ce dossier qui n'est pas un test est pris pour un filtre : le code partagé vit
ailleurs.

- Briques de formulaire des contrôles : `src/ui/controls.tsx` (`TextField`, `NumberField`,
  `ChoiceGroup`, `ToggleGroup`).
- Aides de sérialisation : `src/state/urlParams.ts` (`parseRange`, `formatRange`, `parseChoice`).
- `fromUrl` ne lève jamais : une valeur invalide donne `defaultParams`.
- Tendance et popularité récente lisent `facts.insee.recent` et `facts.insee.previous`
  (10 dernières années de la source et 10 précédentes, précalculées au chargement).

## Tris

Les 6 tris de la v1 sont dans `src/sorts/` (un fichier `.ts` chacun, tests dans `sorts.test.ts`) :
`alphabetical`, `totalPopularity`, `peakYear`, `length`, `recentPopularity`, `trend`. `compare`
décrit l'ordre croissant ; le sens et le départage alphabétique sont gérés par `runQuery`.
`trend` trie sur la variation en nombre de naissances (`recent − previous`).

## Interface

- Routes (hash) : `#/` application (`src/ui/explorer/ExplorerPage.tsx`), `#/prenom/<id>` fiche
  (`src/ui/NamePage.tsx`), `#/dev` diagnostic.
- `src/state/queryStore.ts` porte la requête en cours (recherche, mode, paramètres des filtres,
  tri, sens) ; `useResults()` exécute `runQuery` et renvoie les résultats et les filtres actifs.
- Le panneau de filtres, les pastilles et le sélecteur de tri sont générés depuis les registres ;
  un module dont une source requise n'est pas chargée est masqué. La pastille d'un filtre affiche
  `filter.describe(params)` (méthode optionnelle du contrat `Filter`).
- Mobile (moins de 1024 px) : filtres dans un tiroir plein écran ; desktop : barre latérale fixe.
- La liste est virtualisée sur le défilement de la page (TanStack Virtual, lignes de 72 px).
- `src/ui/inseeView.ts` est le seul fichier de l'interface qui lit les faits INSEE : il fournit
  aux lignes et à la fiche des nombres prêts à afficher.
- Répartition filles/garçons : toujours une barre bicolore ET un libellé ; sur la courbe, les
  deux sexes se distinguent par la couleur et par le tracé (plein ou pointillé).

## Tests de bout en bout, accessibilité, performance

- `e2e/*.e2e.ts` (Playwright, hors Vitest) : `parcours` (recherche, filtres, tri, fiche, lien
  partagé, favoris, export), `accessibilite` (audit axe de chaque écran en clair et en sombre,
  focus au clavier, lien d'évitement, annonce du nombre de résultats), `performance` (chargement,
  réponse d'une recherche et d'un filtre sous 100 ms). Deux projets : `mobile` (Pixel 7) et
  `desktop` (1440 px). Ils ne tournent pas dans le workflow de déploiement.
- Dans un test, attendre la liste avec `expectTop` ou `settledTop` : une ligne sortante reste
  120 ms dans la page pendant son fondu.
- Chargement sans blocage : les traitements longs sont des générateurs exécutés par
  `runInSlices` (`src/core/slices.ts`), par tranches de 8 ms ; `mergeSources` et `toRecords`
  gardent une version directe pour les tests et les scripts.
- Le JSON est livré trié par popularité décroissante (ordre d'affichage par défaut : pas de tri
  au chargement) et mis en cache sous forme de texte (copier l'objet bloquerait l'interface).
- `DevPage` est chargée à la demande (`React.lazy`).
- Ordre des titres : `h1` application, `h2` « Filtres », `h3` groupes, `h4` filtres.

## État dans l'URL, favoris, export

- Format du hash : `#/?q=mar&m=c&f.gender=f&f.length=3-6&s=alphabetical&d=asc` (`q` texte, `m`
  mode, `f.<id>` paramètres d'un filtre actif écrits par son `toUrl`, `s` tri, `d` sens). Les
  valeurs par défaut sont omises. `src/state/urlState.ts` sérialise et lit ; un paramètre inconnu
  ou invalide est ignoré.
- `useUrlSync()` (monté dans `App`) : l'URL remplit la requête à l'ouverture et au retour
  arrière ; chaque changement de la requête réécrit l'URL (`replaceState` pour une frappe,
  `pushState` pour mode, tri, sens, filtre ajouté ou retiré). N'agit que sur la page de liste.
- Le lien de retour d'une fiche est `listHref(requête en cours)`, jamais `#/` nu, qui viderait
  la recherche.
- Favoris : `src/state/favoritesStore.ts`, conservés en `localStorage` (`prenoms:favorites`). Le
  filtre `favorites` est un filtre ordinaire de `src/filters/` ; `useResults()` dépend de l'état
  des favoris pour se recalculer.
- Export : `src/state/exportData.ts`. CSV avec BOM, séparateur `;`, décimales à virgule, une
  colonne par champ calculé et par fait simple (`insee.total`…) ; JSON complet avec les séries.

## Animations

- Réglages dans `src/state/settingsStore.ts` (conservés en `localStorage`) : « Réduire les
  animations » et « Retour tactile ». `MotionRoot` (`src/ui/motion.tsx`) applique le premier, ou
  le réglage du système : Motion ne garde que les fondus, et `data-reduce-motion` sur `<html>`
  coupe les mouvements CSS.
- Liste (`ResultList.tsx`) : seules les lignes affichées existent. Une ligne conservée glisse
  vers sa nouvelle place, une nouvelle entre en fondu, une ancienne s'efface ; le défilement ne
  déclenche aucune animation (une ligne sait si elle apparaît à cause d'un changement de
  résultats). Coupé au-delà de 200 lignes affichées.
- Tracé des courbes et barres : classes CSS `reveal` et `animate-grow-x` (transform seulement).
- Retour d'appui et de survol : classe `pressable`.
- Liste ↔ fiche : API View Transitions dans `useHashRoute.ts`, titre partagé `name-title` ;
  repli `PageTransition` (Motion) si le navigateur ne la gère pas.
- Ne pas utiliser les animations de disposition de Motion (`layout`) ni lire une position
  (`offsetTop`, `getBoundingClientRect`) à chaque rendu : les deux forcent un recalcul de mise en
  page à chaque frappe (mesuré à l'étape 9).
- `useResults()` trie la liste complète une fois par tri, puis filtre en conservant l'ordre.

## Publication

- Métadonnées dans `index.html` : titre, description, balises Open Graph. Les adresses absolues
  viennent de `VITE_SITE_URL` (fichier `.env`) ; icône et manifest passent par `%BASE_URL%`.
- `public/` : `favicon.svg` (source de l'icône), `icon-192.png`, `icon-512.png`,
  `apple-touch-icon.png`, `og.png`, `manifest.webmanifest` (chemins relatifs). Les PNG et les
  captures de `docs/img/` sont produits par `scripts/capture.ts`.
- Crédit obligatoire (Licence Ouverte 2.0) : « Source : Insee » et la date de l'édition, dans le
  pied de page et le README. À mettre à jour avec les données.
- `#/dev` n'est accessible que par le lien « Diagnostic » du pied de page.

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
