# Plan de développement – Explorateur de prénoms

Nov 13, 2026 · @Pierre-Cyril

## Mode d'emploi pour Claude Code

Ce document est la feuille de route complète du projet, enregistrée dans le dépôt sous `docs/PLAN.md`. L'utilisateur te dira seulement « étape suivante » : tu sais alors quoi faire en suivant le protocole ci-dessous, sans qu'il ait à te réécrire de prompt.

**Protocole à chaque « étape suivante »**

1. Lis `docs/PLAN.md` et `PROGRESS.md` (à la racine). L'étape à faire est la première qui n'est pas marquée terminée. Si `PROGRESS.md` n'existe pas, c'est l'étape 1.
2. Relis la section de cette étape dans « Étapes détaillées », et `CLAUDE.md`. N'anticipe jamais une étape suivante.
3. Annonce en quelques lignes ce que tu vas faire, puis exécute sans attendre de validation. Ne pose une question que si tu es réellement bloqué (fichier manquant, accès GitHub, choix irréversible).
4. Implémente l'étape en suivant ses instructions et ses critères de sortie.
5. Vérifie en local : lint, tests et build passent. Les tests des étapes précédentes restent verts.
6. Ajoute à la page de diagnostic `#/dev` une section « Étape N » qui permet de vérifier le résultat en ligne, d'après la rubrique « À vérifier sur le site publié » de l'étape.
7. Commit sur `main` (message `étape N : titre`) et push. Surveille le déploiement (`gh run watch`), puis vérifie que l'URL publiée répond avec un statut 200 et que le SHA affiché sur `#/dev` est celui de ton commit. Si le déploiement échoue, corrige avant de continuer.
8. Mets à jour `PROGRESS.md` (statut, date, commit, URL), commit et push.
9. Termine par un compte-rendu court : ce qui a été fait, l'URL à ouvrir, la liste précise de ce que l'utilisateur doit vérifier (rubrique « À vérifier sur le site publié » de l'étape), et les décisions ou écarts. Puis arrête-toi : n'enchaîne pas sur l'étape suivante.

**Commandes de l'utilisateur**

| Il écrit | Tu fais |
| --- | --- |
| étape suivante | Exécute la prochaine étape non terminée, selon le protocole |
| refais l'étape N : \<problème> | Corrige l'étape N, redéploie, vérifie, note la correction dans `PROGRESS.md` |
| où en est-on ? | Résume `PROGRESS.md` et indique la prochaine étape, sans rien modifier |

**Règles permanentes**

- Une seule étape par demande.
- Si l'utilisateur signale un problème sur une étape terminée, corrige-le avant de passer à la suivante.
- Ne modifie jamais `src/core` pour ajouter une source, un filtre ou un tri. Si c'est inévitable, dis-le clairement et corrige l'architecture plutôt que de la contourner.
- Ne devine pas sur un point irréversible : pose une question courte.
- Pas de `git push --force`, pas de suppression de branche, pas de réglage du dépôt en dehors de GitHub Pages, sans demande explicite.
- Après l'étape 13, toute évolution (nouvelle source, filtre ou tri) suit le même protocole : tests, push, déploiement, vérification, compte-rendu.

**URL publiée** : `https://<utilisateur>.github.io/<dépôt>/`. Elle est créée à l'étape 1 et sert à valider chaque étape.

## Objectifs et contraintes

Le site est une application 100 % statique : elle charge les prénoms de l'INSEE dans le navigateur et permet de les rechercher, filtrer et trier, sur mobile comme sur desktop.

**Contraintes**

- Aucune base de données, aucun serveur : tout tourne dans le navigateur.
- Hébergement sur GitHub Pages (fichiers statiques, servis sous un sous-chemin du type `/nom-du-depot/`).
- Première source de données : le [fichier des prénoms de l'INSEE](https://www.insee.fr/fr/statistiques/8205621).
- Extensible : ajouter une source, un filtre ou un tri = ajouter un fichier, sans modifier le cœur.
- Mobile d'abord, puis desktop. Testable en ligne dès l'étape 1 : chaque étape est déployée sur GitHub Pages pour être validée.
- Développé avec Claude Code, par phases courtes et vérifiables.

**Critères de réussite**

- Un nouveau filtre s'ajoute dans un seul fichier, sans toucher au reste.
- Une nouvelle source s'ajoute en implémentant un seul contrat.
- Recherche et filtres restent fluides sur plusieurs dizaines de milliers de prénoms.
- L'état (recherche, filtres, tri) vit dans l'URL : une recherche se partage par lien.

**Hors périmètre de la v1** : comptes utilisateurs, backend, autres sources que l'INSEE.

## Stack technique

Vite + React + TypeScript, avec des données pré-agrégées au moment du build : c'est le plus simple à héberger sur GitHub Pages et celui que Claude Code maîtrise le mieux. Ce sont des choix par défaut, à valider au démarrage.

| Brique | Choix | Pourquoi |
| --- | --- | --- |
| Build | Vite + TypeScript strict | Build statique, `base` configurable pour Pages |
| UI | React | Composants réutilisables, grand écosystème |
| Style | Tailwind CSS | Responsive mobile d'abord, rapide à itérer |
| État | Zustand + URL | L'URL est la source de vérité des filtres et du tri |
| Routage | Hash (`#/`) | GitHub Pages ne réécrit pas les URL |
| Longues listes | TanStack Virtual | Affiche des dizaines de milliers de lignes sans ralentir |
| Cache | IndexedDB (idb-keyval) | Chargement instantané aux visites suivantes |
| Tests | Vitest, Testing Library, Playwright | Unitaires, composants, bout en bout |
| Déploiement | GitHub Actions + `deploy-pages` | Publication automatique à chaque push sur `main` |

**Pipeline de données.** Les fichiers CSV bruts de l'INSEE sont placés dans `data/raw/`. Un script Node les transforme au build en un JSON compact par source, rangé dans `public/data/`. Le navigateur ne lit jamais le CSV brut : une ligne par prénom (avec sa série annuelle) est bien plus légère qu'une ligne par prénom et par année. Selon [Baptiste Coulmont](https://coulmont.com/varia/2026/2026-prenoms-rapport.pdf), l'édition 2026 compte 43 459 prénoms différents, ce qui tient largement en mémoire.

**Points de vigilance sur le fichier INSEE** : la documentation de l'[INSEE](https://www.insee.fr/fr/statistiques/8205621) indique que l'année de naissance peut valoir `XXXX` (inconnue). Le fichier peut aussi contenir un regroupement de prénoms rares. Depuis juillet 2026, les effectifs sont [arrondis au multiple de 5](https://insee.fr/fr/statistiques/3532172). Claude Code doit inspecter le fichier réel avant de coder le script. La licence de réutilisation est à vérifier sur la page du jeu de données.

## Direction design

Le site doit être moderne, très lisible pour comparer des prénoms, et agréable à manipuler : chaque recherche, filtre ou tri répond en direct, avec un mouvement doux qui rend la navigation satisfaisante.

**Lisibilité d'abord**

- Le prénom est l'élément le plus grand de chaque ligne ; viennent ensuite le total de naissances et la tendance.
- Chiffres tabulaires, séparateurs de milliers, contrastes conformes WCAG AA, texte recherché surligné dans le prénom.
- La répartition filles/garçons est une barre bicolore accompagnée d'un libellé : jamais la couleur seule.
- Mise en page aérée, une seule couleur d'accent, thème clair et sombre.

**Réaction de l'interface**

| Action | Réaction |
| --- | --- |
| Taper dans la recherche | Résultats en direct, lignes qui glissent vers leur nouvelle place, compteur animé |
| Ajouter ou retirer un filtre | Pastille qui apparaît ou disparaît, liste qui se resserre en douceur |
| Changer de tri | Lignes qui se réordonnent, barres qui se redimensionnent |
| Ouvrir un prénom | Transition fluide vers la fiche, courbe qui se trace |
| Mettre en favori | Cœur animé, retour tactile discret sur mobile |
| Ouvrir les filtres (mobile) | Tiroir à ressort doux, qui se ferme en le faisant glisser |

**Règles de mouvement**

- Durées de 120 à 250 ms (350 ms au plus pour une transition de page), mouvements doux, sans rebond exagéré.
- On n'anime que `transform` et `opacity`, pour tenir 60 images par seconde.
- Sur la liste virtualisée, seules les lignes visibles (une trentaine) sont animées ; si trop de lignes changent d'un coup, on supprime l'animation plutôt que de ralentir.
- Le réglage système `prefers-reduced-motion` est respecté, avec en plus un réglage « Réduire les animations » dans l'interface.

**Jetons de design** (définis à l'étape 1 et réutilisés partout) : couleurs (surface, texte, accent, deux teintes distinctes pour les sexes, états), polices auto-hébergées, rayons de 12 à 16 px, espacements en multiples de 4, durées et courbes d'animation partagées.

**Outils** : la bibliothèque Motion pour React (paquet `motion`) pour les animations de disposition et d'apparition, l'API View Transitions pour passer de la liste à la fiche, Tailwind pour le reste. Claude Code vérifie les noms de paquets et la compatibilité avant d'installer.

## Architecture extensible

Le cœur de l'application ne connaît ni l'INSEE, ni aucun filtre précis : il définit des contrats, et chaque source, filtre ou tri est un module qui s'inscrit dans un registre.

&#91;embedded content: architecture · 4 étapes et 4 registres\]

Les données traversent quatre étapes de gauche à droite ; chacune s'appuie sur un registre qui découvre les modules ajoutés.

**Quatre points d'extension**

| Extension | Contrat | Où l'ajouter |
| --- | --- | --- |
| Source de données | `DataSource` : charge des prénoms et leurs faits | `src/sources/<id>/index.ts` |
| Champ calculé | `DerivedField` : calcule une valeur depuis un prénom (longueur, initiale…) | `src/derived/<id>.ts` |
| Filtre | `Filter` : paramètres, test, contrôle d'interface, lecture/écriture dans l'URL | `src/filters/<id>.tsx` |
| Tri | `Sort` : comparateur, sources requises | `src/sorts/<id>.ts` |

**Règles d'or**

1. `src/core` ne dépend jamais d'un module précis : les registres découvrent les modules avec `import.meta.glob`.
2. Un prénom est identifié par sa forme normalisée (minuscules, sans accents) : c'est la clé de fusion entre sources.
3. Chaque source range ses données sous sa propre clé dans `facts` : deux sources ne s'écrasent jamais.
4. Un filtre ou un tri déclare les sources dont il a besoin ; l'interface le masque si la source n'est pas chargée.
5. L'interface ne contient aucune logique métier : elle affiche ce que les registres décrivent.

**Contrats (esquisse à affiner avec Claude Code)**

```ts
interface NameEntry {
  id: string;                          // forme normalisée, clé de fusion
  label: string;                       // forme d'affichage
  derived: Record<string, unknown>;    // champs calculés
  facts: Record<string, unknown>;      // un bloc par source (facts.insee…)
}

interface DataSource {
  id: string;
  label: string;
  load(onProgress?: (p: number) => void): Promise<SourceData>;
}

interface Filter<P> {
  id: string;
  label: string;
  requires?: string[];                 // ids de sources
  defaultParams: P;
  isActive(p: P): boolean;
  test(entry: NameEntry, p: P): boolean;
  Control: React.ComponentType<{ value: P; onChange(p: P): void }>;
  toUrl(p: P): string;
  fromUrl(s: string): P;
}

interface Sort {
  id: string;
  label: string;
  requires?: string[];
  compare(a: NameEntry, b: NameEntry): number;
}
```

**Flux** : le navigateur charge les sources, les fusionne en une liste de `NameEntry`, ajoute les champs calculés, puis chaque changement de recherche, de filtre ou de tri rejoue le pipeline *recherche, filtres, tri* et l'interface affiche le résultat.

## Dépôt, données et critères de la v1

Chaque dossier correspond à un point d'extension : on ajoute un fichier, jamais on ne modifie un module existant.

```text
src/
  core/      types, registres, pipeline (aucune dépendance UI)
  sources/   un dossier par source (insee/)
  derived/   un fichier par champ calculé
  filters/   un fichier par filtre
  sorts/     un fichier par tri
  ui/        layout, liste, panneau de filtres, fiche prénom
  state/     store + sérialisation de l'URL
scripts/     build-data (CSV vers JSON)
data/raw/    fichiers sources bruts (non publiés)
public/data/ JSON générés, publiés sur Pages
docs/        guides d'extension
.github/workflows/deploy.yml
CLAUDE.md
```

**Faits INSEE stockés par prénom** (`facts.insee`), calculés par le script de build :

| Champ | Contenu |
| --- | --- |
| `total` | Naissances cumulées depuis 1900 |
| `male`, `female` | Naissances par sexe |
| `byYear` | Série annuelle compacte, par sexe |
| `firstYear`, `lastYear` | Première et dernière année où le prénom apparaît |
| `peakYear`, `peakCount` | Année et effectif du pic |

**Champs calculés au chargement** : longueur, initiale, nombre de voyelles, prénom composé (tiret ou espace), présence d'accents, part féminine, mixité.

**Filtres de la v1** : recherche texte (commence par, contient, finit par), initiale, longueur, lettres incluses ou exclues, sexe et mixité, popularité totale, popularité sur une période, année ou décennie du pic, tendance (en hausse ou en baisse), prénom composé, accents.

**Tris de la v1** : alphabétique, popularité totale, année du pic, longueur, popularité récente, tendance.

## Roadmap par phases

Treize étapes, dans l'ordre. Le site est en ligne dès l'étape 1 : chaque étape se termine par un push, un déploiement automatique et une liste précise de choses à vérifier sur l'URL publiée.

1. **Initialisation et déploiement** : squelette Vite + React + TypeScript, jetons de design, page de diagnostic `#/dev`, dépôt GitHub, workflow Pages. En ligne : la page d'accueil et `#/dev` avec le SHA et la date de build.
2. **Contrats du cœur** : types, registres, découverte automatique des modules. En ligne : `#/dev` liste le contenu des registres.
3. **Pipeline de données INSEE** : script CSV vers JSON compact. En ligne : `#/dev` affiche les statistiques des données générées.
4. **Source INSEE dans le navigateur** : chargement, cache, champs calculés. En ligne : `#/dev` montre la progression, le nombre de prénoms et un échantillon.
5. **Moteur de requête** : recherche insensible aux accents, filtres, tri. En ligne : `#/dev` propose une recherche brute avec le temps de réponse.
6. **Filtres de la v1** : un fichier par filtre, avec son contrôle. En ligne : `#/dev` montre chaque filtre et son effet sur le nombre de résultats.
7. **Tris de la v1** : un fichier par tri. En ligne : `#/dev` montre chaque tri dans les deux sens.
8. **Interface : structure et lisibilité** : liste virtualisée, panneau de filtres, fiche prénom, états. En ligne : l'accueil devient l'application, lisible sur téléphone et ordinateur.
9. **Animations et interactions** : mouvement des listes, compteurs, tiroir, favoris, transitions. En ligne : chaque recherche, filtre ou tri répond en douceur.
10. **État dans l'URL, favoris, export** : liens partageables, favoris locaux, export CSV. En ligne : un lien rouvre exactement la même recherche.
11. **Tests, performance, accessibilité** : bout en bout, Lighthouse, axe. En ligne : les scénarios passent sur l'URL publiée.
12. **Finitions de publication** : README, captures, métadonnées de partage. En ligne : aperçu de lien et README complets.
13. **Documentation et preuve d'extensibilité** : guides, ajout d'une source factice et d'un filtre sans toucher au cœur. En ligne : la preuve est notée dans `PROGRESS.md`.

**Rythme de travail**

- Tu écris « étape suivante » à Claude Code : il lit ce plan, exécute l'étape, déploie et te dit quoi vérifier.
- Tu ouvres l'URL publiée et tu valides, ou tu décris le problème avec « refais l'étape N : ce qui ne va pas ».
- Quand c'est bon, tu écris de nouveau « étape suivante ».

## Étapes détaillées

Chaque étape contient les instructions à exécuter, ses critères de sortie et ce que l'utilisateur vérifie sur le site publié. Applique le protocole du début du document à chaque étape.

### Étape 1 – Initialisation et déploiement

```text
Étape 1 : initialise le projet ET mets-le en ligne sur GitHub Pages dès maintenant.

Projet : application statique "Explorateur de prénoms" en Vite + React + TypeScript (mode strict). Aucune base de données ni backend, tout tourne dans le navigateur. Routage par hash (#/). `base` de Vite configurable par la variable d'environnement VITE_BASE (sous-chemin GitHub Pages).

1. Installe et configure : Tailwind CSS, Vitest + Testing Library, ESLint + Prettier, alias `@/` vers `src/`, et la bibliothèque d'animation Motion (paquet `motion`, vérifie le nom et la compatibilité avec React). Définis les jetons de design de la section "Direction design" du plan (couleurs claires et sombres, polices auto-hébergées, rayons, espacements, durées et courbes d'animation) dans la config Tailwind et en variables CSS : la page #/dev doit déjà les utiliser.
2. Crée l'arborescence : src/core, src/sources, src/derived, src/filters, src/sorts, src/ui, src/state, scripts, data/raw (ignoré par git), public/data, docs.
3. Vérifie que docs/PLAN.md existe (l'utilisateur doit l'y avoir placé). Sinon, demande-le-lui et attends.
4. Crée CLAUDE.md : but du projet, contraintes, arborescence, commandes (dev, build, test, lint), règle d'or (src/core ne dépend jamais d'une source, d'un filtre ou d'un tri précis ; on étend en ajoutant un fichier dans sources/, derived/, filters/ ou sorts/), et le protocole "étape suivante" avec renvoi vers docs/PLAN.md et PROGRESS.md.
5. Crée PROGRESS.md : un tableau des 13 étapes (numéro, titre, statut, date, commit, URL de vérification), toutes "à faire" sauf celle-ci à la fin.
6. Crée une page d'accueil minimale et la page de diagnostic #/dev, qui restera pendant tout le projet : elle affiche le nom du projet, le SHA du commit et la date de build (injectés par Vite au build), puis une section par étape, remplie au fil des étapes.
7. Dépôt GitHub : vérifie `git remote -v` et `gh auth status`. S'il n'y a pas de dépôt distant, propose de le créer avec gh (public, nom à confirmer), puis active Pages avec la source "GitHub Actions" (gh api). Si gh n'est pas disponible, donne-moi les étapes manuelles une par une et attends.
8. Crée .github/workflows/deploy.yml : sur push vers main, npm ci, lint, tests, build avec VITE_BASE=/${{ github.event.repository.name }}/, puis publication de dist/ avec actions/upload-pages-artifact et actions/deploy-pages (permissions contents: read, pages: write, id-token: write).
9. Vérifie le rendu sous sous-chemin en local : `vite preview --base /nom-du-depot/`, page d'accueil et #/dev.
10. Commit, push, surveille le déploiement, vérifie par curl que l'URL publiée répond 200 et que #/dev affiche le bon SHA. Note l'URL dans PROGRESS.md et dans un README minimal.
```

**Critères de sortie** : lint, tests et build passent ; le workflow est vert ; `PROGRESS.md`, `CLAUDE.md` et le README existent.

**À vérifier sur le site publié**

- L'URL `https://<utilisateur>.github.io/<dépôt>/` affiche la page d'accueil.
- `#/dev` affiche le SHA du commit et la date de build, et reste affichée après un rechargement de la page.
- Le site s'ouvre aussi sur téléphone.

### Étape 2 – Contrats du cœur

```text
Dans src/core, définis et teste avec Vitest les contrats de l'application, sans aucune dépendance à React dans les types métier :

1. NameEntry : { id (forme normalisée : minuscules, sans accents), label (forme d'affichage), derived: Record<string, unknown>, facts: Record<string, unknown> }.
2. DataSource : { id, label, load(onProgress?) => Promise<SourceData> }.
3. DerivedField : { id, compute(entry) => valeur }.
4. Filter<P> : { id, label, group, requires?, defaultParams, isActive(p), test(entry, p), Control (composant React), toUrl(p), fromUrl(s) }.
5. Sort : { id, label, requires?, compare(a, b) }.

Crée un registre générique pour chacun de ces quatre types, qui découvre automatiquement les modules avec import.meta.glob (src/sources/*/index.ts, src/derived/*.ts, src/filters/*.tsx, src/sorts/*.ts). Un module invalide (id manquant ou en double) doit lever une erreur claire.

Fournis une fonction normalizeName() testée sur : accents, majuscules, tirets, apostrophes, espaces multiples.

Si une de mes consignes te semble ambiguë ou incomplète, propose ta version dans le plan avant de coder. Mode plan d'abord.
```

**Critères de sortie** : les tests des registres et de `normalizeName()` sont verts ; un module invalide ou en double lève une erreur claire.

**À vérifier sur le site publié**

- `#/dev` liste le contenu des quatre registres, avec des modules d'exemple factices qui prouvent la découverte automatique.
- Un champ de saisie affiche le résultat de `normalizeName()` en direct.

### Étape 3 – Pipeline de données INSEE

```text
Le fichier des prénoms de l'INSEE (CSV) doit se trouver dans data/raw/ (ignoré par git, trop volumineux). S'il n'y est pas, cherche son lien de téléchargement sur https://www.insee.fr/fr/statistiques/8205621 et télécharge-le ; si le téléchargement échoue, demande à l'utilisateur de le placer dans data/raw/ et attends.

D'abord, avant de coder : inspecte les premières lignes et la structure du fichier (séparateur, colonnes, encodage, valeurs spéciales comme une année inconnue ou un regroupement de prénoms rares) et résume-les-moi.

Ensuite, écris scripts/build-data.ts (exécutable avec `npm run build:data`) qui lit ce CSV et génère public/data/insee.json, avec :
- un bloc meta : version du format, date de génération, nom du fichier source, année min et max
- une entrée par prénom, au format compact : forme d'affichage, effectif total, effectif masculin et féminin, série annuelle par sexe
- exclusion des lignes sans année connue ou des regroupements de prénoms rares : ne les perds pas silencieusement, compte-les et affiche-les dans un rapport

Ajoute des tests sur un petit CSV d'exemple (data/fixtures/) et un script de validation qui vérifie que la somme des effectifs du JSON correspond à celle du CSV.

Affiche à la fin la taille du JSON généré (brut et gzip). Si elle dépasse 3 Mo gzip, propose une version plus compacte avant de continuer.
```

**Critères de sortie** : `public/data/insee.json` est généré et commité ; les tests sont verts ; la somme des effectifs du JSON est identique à celle du CSV ; la taille reste sous 3 Mo en gzip.

**À vérifier sur le site publié**

- `#/dev` affiche le nombre de prénoms, la plage d'années, la taille brute et gzip, et le nombre de lignes exclues.
- L'adresse `<URL>/data/insee.json` télécharge bien le fichier.

### Étape 4 – Source INSEE dans le navigateur

```text
Implémente la source INSEE côté navigateur dans src/sources/insee/index.ts, en respectant le contrat DataSource de src/core.

- Elle charge public/data/insee.json avec fetch (en tenant compte de import.meta.env.BASE_URL pour GitHub Pages) et expose la progression.
- Elle met le JSON en cache dans IndexedDB (idb-keyval), avec invalidation par la version et la date de génération du bloc meta.
- Elle produit des NameEntry dont facts.insee contient : total, male, female, byYear, firstYear, lastYear, peakYear, peakCount.

Ajoute dans src/derived un fichier par champ calculé : length, initial, vowelCount, isCompound (tiret ou espace), hasAccent, femaleShare, isMixed (au moins 20 % de chaque sexe, seuil en constante).

Crée un store dans src/state qui charge toutes les sources enregistrées au démarrage, les fusionne par id, calcule les champs dérivés et expose : entries, état de chargement, erreur.

Ajoute des tests unitaires. Affiche temporairement le nombre de prénoms chargés à l'écran pour vérifier.
```

**Critères de sortie** : tests verts ; les `NameEntry` fusionnés sont disponibles dans le store ; le cache IndexedDB fonctionne.

**À vérifier sur le site publié**

- Au premier chargement, `#/dev` montre une progression, puis le nombre de prénoms chargés (cohérent avec celui de l'étape 3).
- Un échantillon de 10 prénoms s'affiche avec leurs faits et champs calculés.
- Après rechargement, la page indique que les données viennent du cache.

### Étape 5 – Moteur de requête

```text
Dans src/core, implémente le pipeline de requête pur (sans React) : runQuery(entries, { search, filters, sortId, direction }) qui renvoie la liste filtrée et triée.

- La recherche texte est insensible à la casse et aux accents, avec trois modes : commence par, contient, finit par.
- Les filtres actifs viennent des registres : seuls ceux dont isActive est vrai sont appliqués, et un filtre dont une source requise n'est pas chargée est ignoré.
- Le tri vient du registre, avec le sens croissant ou décroissant. À égalité, départage par ordre alphabétique pour un résultat stable.

Ajoute des tests unitaires, plus un test de performance qui vérifie qu'une requête avec 5 filtres sur 50 000 entrées synthétiques s'exécute en moins de 100 ms ; si ce n'est pas le cas, optimise (pré-calcul, ordre des filtres du plus sélectif au moins sélectif).

Ne crée aucun filtre ni tri réel dans cette phase : utilise des filtres et des tris factices dans les tests.
```

**Critères de sortie** : tests unitaires verts ; une requête avec 5 filtres sur 50 000 entrées s'exécute en moins de 100 ms.

**À vérifier sur le site publié**

- `#/dev` propose un champ de recherche avec ses trois modes, le nombre de résultats et le temps de réponse en millisecondes.
- Chercher « lea » et « Léa » donne exactement les mêmes résultats.

### Étape 6 – Filtres de la v1

```text
Crée les filtres de la v1, un fichier par filtre dans src/filters/, chacun respectant le contrat Filter, avec son composant Control, sa sérialisation URL (toUrl, fromUrl) et un test :

1. textSearch : commence par, contient, finit par.
2. initial : une ou plusieurs initiales.
3. length : minimum et maximum de lettres.
4. letters : lettres qui doivent figurer, lettres qui ne doivent pas figurer.
5. gender : garçons, filles, mixte (utilise femaleShare).
6. totalPopularity : minimum et maximum de naissances cumulées.
7. periodPopularity : minimum de naissances sur une période (année de début et de fin).
8. peakPeriod : année du pic comprise entre deux années, avec raccourcis par décennie.
9. trend : en hausse ou en baisse, en comparant les 10 dernières années aux 10 précédentes.
10. compound : prénoms composés uniquement ou exclus.
11. accents : avec ou sans accents.

Ces filtres déclarent requires: ['insee'] quand ils lisent facts.insee. Range-les dans des groupes (Texte, Popularité, Chronologie, Forme) pour l'interface.

Les contrôles ne sont pas encore intégrés à l'interface finale (étape 8) : vérifie par les tests, et affiche chaque Control avec le nombre de résultats en direct dans la section de cette étape de la page #/dev.
```

**Critères de sortie** : les 11 filtres existent chacun dans leur fichier, avec contrôle, sérialisation URL et tests verts.

**À vérifier sur le site publié**

- `#/dev` affiche chaque filtre dans son groupe, avec son contrôle.
- Modifier un contrôle met à jour en direct le nombre de résultats.
- Combiner deux filtres réduit encore le nombre de résultats.

### Étape 7 – Tris de la v1

```text
Crée les tris de la v1, un fichier par tri dans src/sorts/, chacun respectant le contrat Sort et testé :

1. alphabetical
2. totalPopularity
3. peakYear
4. length
5. recentPopularity (naissances sur les 10 dernières années de la source)
6. trend (variation entre les 10 dernières années et les 10 précédentes)

Le sens (croissant ou décroissant) est géré par le pipeline, pas par le tri. Chaque tri qui lit facts.insee déclare requires: ['insee'].

Vérifie que l'ajout d'un septième tri ne nécessite aucune modification en dehors de src/sorts/ : montre-moi la liste des fichiers modifiés pour le prouver.
```

**Critères de sortie** : les 6 tris existent chacun dans leur fichier, testés dans les deux sens ; ajouter un tri ne modifie rien hors de `src/sorts/`.

**À vérifier sur le site publié**

- `#/dev` propose un sélecteur de tri et de sens, et affiche les 20 premiers résultats.
- Chaque tri donne un ordre plausible, et inverser le sens inverse bien la liste.

### Étape 8 – Interface : structure et lisibilité

```text
Étape 8 : construis l'interface en suivant la section "Direction design" du plan. Mobile d'abord (360 px puis 1440 px de large). Aucune logique métier dans src/ui : elle affiche ce que les registres décrivent. Les animations viennent à l'étape suivante : ici, structure, lisibilité et états.

Lisibilité :
- Chaque ligne de résultat montre le prénom en grand, le total de naissances, la répartition filles/garçons en barre bicolore (avec libellé, jamais la couleur seule) et une mini-courbe d'évolution en SVG.
- Le texte recherché est surligné dans le prénom.
- Chiffres tabulaires, séparateurs de milliers, contrastes AA.

Structure :
- En-tête fixe : champ de recherche large avec le mode (commence par, contient, finit par), compteur de résultats, raccourcis clavier ("/" pour chercher, "Échap" pour effacer).
- Panneau de filtres généré automatiquement depuis le registre, groupé par `group`. Mobile : tiroir plein écran ouvert par un bouton "Filtres" qui affiche le nombre de filtres actifs. Desktop : barre latérale fixe.
- Pastilles des filtres actifs, supprimables, et bouton "Tout réinitialiser".
- Sélecteur de tri et de sens alimenté par le registre.
- Liste des résultats virtualisée (TanStack Virtual).
- Fiche d'un prénom (route #/prenom/<id>) : grande courbe annuelle par sexe, pic, première et dernière année, répartition.
- États : chargement (squelettes), erreur (bouton réessayer), aucun résultat (suggestion d'assouplir les filtres et bouton de réinitialisation).
- Thème clair et sombre selon le système, cibles tactiles d'au moins 44 px, navigation au clavier, focus visible.

Joins au compte-rendu des captures d'écran (Playwright) à 360 px et 1440 px, en thème clair et sombre.
```

**Critères de sortie** : lint, tests et build passent ; des captures à 360 px et 1440 px de large sont jointes au compte-rendu.

**À vérifier sur le site publié**

- L'accueil est maintenant l'application complète.
- Sur téléphone : le tiroir de filtres s'ouvre en plein écran et la liste défile sans saccade.
- Sur ordinateur : les filtres sont dans une barre latérale fixe.
- Un clic sur un prénom ouvre sa fiche avec la courbe annuelle.
- Le thème suit le réglage clair ou sombre de l'appareil.

### Étape 9 – Animations et interactions

```text
Étape 9 : ajoute les animations et les micro-interactions, selon la section "Direction design" du plan. Aucune modification dans src/core. Utilise la bibliothèque Motion installée à l'étape 1.

Listes :
- Quand les résultats changent (recherche, filtre, tri), les lignes visibles glissent vers leur nouvelle place (animation de disposition), les nouvelles entrent en fondu léger, celles qui disparaissent sortent sans à-coup. Limite ces animations aux lignes visibles (une trentaine) ; si plus de 200 lignes changent d'un coup, désactive-les pour garder 60 images par seconde.
- Au premier affichage, les premières lignes apparaissent avec un léger décalage (300 ms au total au maximum).
- La liste ne saute jamais : la position de défilement est conservée.

Compteurs et indicateurs :
- Le nombre de résultats s'anime d'une valeur à l'autre.
- Les barres de répartition se redimensionnent en douceur ; les mini-courbes se tracent à l'apparition.
- Les pastilles de filtres apparaissent et disparaissent avec un petit effet d'échelle.

Interactions :
- Retour visuel sur chaque élément cliquable : survol (élévation légère), appui (réduction à 98 %), focus visible.
- Tiroir de filtres mobile : ressort doux, fermeture en le faisant glisser.
- Cœur des favoris avec une courte animation au clic. Copier un prénom affiche une notification discrète.
- Transition fluide entre la liste et la fiche d'un prénom (View Transitions si disponible, sinon animation Motion).
- Retour tactile : vibration très courte sur mobile pour les actions principales, désactivable.

Règles :
- Durées de 120 à 250 ms (350 ms au plus pour une transition de page), mouvements doux, sans rebond exagéré.
- Anime uniquement transform et opacity.
- Respecte prefers-reduced-motion en réduisant tout à de simples fondus, et ajoute un réglage "Réduire les animations" dans l'interface.
- Mesure la fluidité (trace de performance Chrome ou Playwright) pendant une frappe rapide et pendant un changement de tri sur la liste complète, et note le résultat dans le compte-rendu. Si une animation fait tomber sous 50 images par seconde, simplifie-la.
```

**Critères de sortie** : lint, tests et build passent ; la fluidité mesurée reste proche de 60 images par seconde ; le réglage "Réduire les animations" fonctionne.

**À vérifier sur le site publié**

- En tapant dans la recherche, la liste se réorganise en douceur et le compteur de résultats s'anime.
- En changeant de tri, les lignes glissent vers leur nouvelle place.
- Ajouter un filtre fait apparaître sa pastille et resserre la liste sans à-coup.
- Sur téléphone, le tiroir de filtres suit le doigt et se ferme en glissant.
- Avec "Réduire les animations" activé (ou dans les réglages du système), plus aucun mouvement ample n'apparaît.
- Rien ne saccade, même en tapant vite sur un téléphone ordinaire.

### Étape 10 – État dans l'URL, favoris, export

```text
Ajoute trois fonctions, sans modifier src/core :

1. État dans l'URL : recherche, mode, filtres actifs et tri sont sérialisés dans le hash avec les méthodes toUrl et fromUrl de chaque filtre. Ouvrir un lien restaure exactement la même vue ; un paramètre invalide est ignoré sans erreur. Utilise replaceState pour les frappes et pushState pour les changements discrets.
2. Favoris : bouton cœur sur chaque ligne et sur la fiche, stocké dans localStorage, avec un filtre "Favoris uniquement" ajouté comme un filtre ordinaire dans src/filters.
3. Export : bouton "Exporter" qui télécharge la liste filtrée et triée en CSV (UTF-8 avec BOM, pour Excel) et en JSON, avec les colonnes dérivées et les faits de chaque source.

Ajoute des tests, dont un aller-retour sérialisation/désérialisation pour chaque filtre.
```

**Critères de sortie** : tests verts, dont l'aller-retour de sérialisation de chaque filtre ; `src/core` inchangé.

**À vérifier sur le site publié**

- Après avoir filtré et trié, copier l'URL et l'ouvrir dans un onglet privé affiche exactement la même vue.
- Les favoris restent après un rechargement de la page.
- L'export CSV s'ouvre dans Excel avec les accents corrects.

### Étape 11 – Tests, performance, accessibilité

```text
Stabilise l'application :

- Playwright : scénarios bout en bout (recherche, ajout et retrait de filtres, tri, ouverture d'une fiche, lien partagé, favoris, export), sur un viewport mobile et un viewport desktop.
- Accessibilité : audit axe sur chaque écran, contrastes, libellés des champs, focus visible, annonces des résultats pour lecteur d'écran.
- Performance : mesure le temps de chargement initial et le temps de réponse d'un filtre sur les vraies données INSEE. Si le filtrage dépasse 100 ms ressentis, déplace le pipeline dans un Web Worker (Comlink) sans changer les contrats du cœur.
- Lighthouse mobile : vise au moins 90 en performance et en accessibilité.

Corrige ce que tu trouves, et liste ce que tu as choisi de ne pas corriger, avec la raison.
```

**Critères de sortie** : les scénarios Playwright passent en local et contre l'URL publiée ; Lighthouse mobile atteint au moins 90 en performance et en accessibilité ; aucune violation axe bloquante. Les scores sont notés dans `PROGRESS.md`.

**À vérifier sur le site publié**

- Ouvrir le site sur un téléphone en 4G : le chargement est acceptable.
- Naviguer au clavier uniquement : le focus reste visible partout.

### Étape 12 – Finitions de publication

```text
Le déploiement existe depuis l'étape 1. Finalise la publication :

- README complet : description, captures d'écran (Playwright, mobile et desktop, rangées dans docs/img/), URL publiée, commandes, comment régénérer les données, crédits et licence des données INSEE (vérifie la licence sur la page du jeu de données), liens vers les guides de docs/.
- Titre, description et icône de la page, balises Open Graph pour l'aperçu de lien, manifest minimal.
- Vérifie que data/raw/ n'est pas publié, que public/data/insee.json est bien commité (le build en ligne ne régère pas les données) et que tout fonctionne sous le sous-chemin de Pages.
- Retire de l'accueil tout ce qui est temporaire. Garde #/dev, accessible seulement par un lien discret en pied de page.
```

**Critères de sortie** : le README est complet et ses liens fonctionnent ; l'aperçu de lien affiche titre et description.

**À vérifier sur le site publié**

- L'onglet du navigateur affiche le bon titre et la bonne icône.
- Coller l'URL dans une messagerie affiche un aperçu correct.
- Le README du dépôt GitHub est lisible, avec ses captures.

### Étape 13 – Documentation et preuve d'extensibilité

```text
Écris trois guides courts dans docs/ : ajouter une source, ajouter un filtre, ajouter un tri. Chacun contient le contrat, un exemple complet et la liste exacte des fichiers à créer.

Puis prouve l'extensibilité en suivant uniquement ces guides :
1. Ajoute une source factice "demo" (une dizaine de prénoms en dur) dans src/sources/demo/.
2. Ajoute un filtre qui utilise facts.demo.
3. Ajoute un tri qui utilise facts.demo.

Montre-moi `git diff --stat` : aucun fichier de src/core ni de src/ui ne doit avoir changé. Si c'est le cas, corrige l'architecture plutôt que le test. Une fois validé, retire la source factice (ou garde-la derrière une variable d'environnement de développement).
```

**Critères de sortie** : les trois guides existent dans `docs/` ; le `git diff --stat` noté dans `PROGRESS.md` ne montre aucun changement dans `src/core` ni `src/ui`.

**À vérifier sur le site publié**

- Les guides sont lisibles sur la page GitHub du dépôt.
- La source factice n'apparaît pas sur le site publié, sauf si tu as choisi de la garder.

## Évolutions et contrôles

Une fois la v1 en ligne, chaque évolution suit le même modèle : un prompt court qui renvoie au guide d'extension.

**Prompt type – ajouter une source**

```text
Ajoute la source "<nom>" en suivant docs/ajouter-une-source.md. Données : <fichier ou lien, format, colonnes>. Ajoute son script de build dans scripts/ si les données sont brutes. Les facts de cette source vont sous facts.<id>. Ne modifie ni src/core ni src/ui ; si c'est impossible, explique pourquoi avant de coder.
```

**Prompt type – ajouter un filtre ou un tri**

```text
Ajoute le filtre "<nom>" qui <règle précise, avec ses paramètres> en suivant docs/ajouter-un-filtre.md : un seul fichier dans src/filters/, son Control, sa sérialisation URL et ses tests. Montre git diff --stat à la fin : seul src/filters/ doit changer.
```

**Évolutions envisagées**

- Sources : fichiers du SSA (États-Unis), prochains fichiers INSEE par département, Wikidata pour l'origine et la langue, ONS (Royaume-Uni).
- Filtres : origine, phonétique et rimes, nombre de syllabes, rareté par rapport à une époque.
- Interface : comparaison de plusieurs prénoms, listes personnalisées, mode hors ligne (PWA).

**Checklist avant chaque fusion**

- [ ] `npm run lint`, `npm test` et `npm run build` passent.
- [ ] Aucun fichier de `src/core` n'a été modifié pour ajouter une source, un filtre ou un tri.
- [ ] Le JSON généré reste sous la taille cible, et son total correspond au CSV.
- [ ] Le site fonctionne sous le sous-chemin de GitHub Pages.
- [ ] Un lien partagé restaure exactement la même vue.
- [ ] L'interface reste utilisable à 360 px de large.
- [ ] `CLAUDE.md` et `docs/` sont à jour.
