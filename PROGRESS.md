# Avancement

URL publiée : https://pierrecyrildecrock.github.io/Prenoms/

| N°  | Étape                                   | Statut   | Date       | Commit    | URL de vérification                                          |
| --- | --------------------------------------- | -------- | ---------- | --------- | ------------------------------------------------------------ |
| 1   | Initialisation et déploiement           | terminée | 2026-11-12 | `d282967` | https://pierrecyrildecrock.github.io/Prenoms/#/dev           |
| 2   | Contrats du cœur                        | terminée | 2026-11-12 | `9b7f058` | https://pierrecyrildecrock.github.io/Prenoms/#/dev           |
| 3   | Pipeline de données INSEE               | terminée | 2026-11-12 | `18153cf` | https://pierrecyrildecrock.github.io/Prenoms/#/dev           |
| 4   | Source INSEE dans le navigateur         | terminée | 2026-11-13 | `33f23a6` | https://pierrecyrildecrock.github.io/Prenoms/#/dev           |
| 5   | Moteur de requête                       | terminée | 2026-11-13 | `5de104e` | https://pierrecyrildecrock.github.io/Prenoms/#/dev           |
| 6   | Filtres de la v1                        | terminée | 2026-11-13 | `9f4a648` | https://pierrecyrildecrock.github.io/Prenoms/#/dev           |
| 7   | Tris de la v1                           | terminée | 2026-11-13 | `b4e595a` | https://pierrecyrildecrock.github.io/Prenoms/#/dev           |
| 8   | Interface : structure et lisibilité     | terminée | 2026-11-13 | `7e3956d` | https://pierrecyrildecrock.github.io/Prenoms/                |
| 9   | Animations et interactions              | terminée | 2026-11-13 | `98fa48d` | https://pierrecyrildecrock.github.io/Prenoms/                |
| 10  | État dans l'URL, favoris, export        | terminée | 2026-11-13 | `cc6362e` | https://pierrecyrildecrock.github.io/Prenoms/                |
| 11  | Tests, performance, accessibilité       | terminée | 2026-11-13 | `65aa5c5` | https://pierrecyrildecrock.github.io/Prenoms/                |
| 12  | Finitions de publication                | terminée | 2026-11-13 | `6f64a93` | https://pierrecyrildecrock.github.io/Prenoms/                |
| 13  | Documentation et preuve d'extensibilité | terminée | 2026-11-13 | `d909bc7` | https://github.com/PierreCyrilDecrock/Prenoms/tree/main/docs |

## Journal

### Étape 1 – 2026-11-12

- Commit `d282967`, workflow « Déploiement GitHub Pages » vert (2ᵉ tentative : la 1ʳᵉ a échoué
  tant que Pages n'était pas activé avec la source « GitHub Actions »).
- `docs/PLAN.md` créé à partir du fichier fourni par l'utilisateur.
- `version.json` publié à la racine du site (SHA et date de build) pour vérifier un déploiement.
- L'URL publiée n'a pas pu être vérifiée par curl depuis la session de développement (hôte
  `github.io` bloqué par le réseau de l'environnement) : vérification du SHA sur `#/dev` à faire
  par l'utilisateur.

### Étape 2 – 2026-11-12

- Commit `9b7f058`, workflow vert. URL publiée non vérifiable par curl depuis la session
  (hôte `github.io` bloqué) : SHA à confirmer sur `#/dev` par l'utilisateur.
- Choix faits sur les points laissés ouverts par le plan :
  - un module = l'`export default` de son fichier ;
  - `SourceData` = `{ records: { label, facts }[], meta? }` ; l'`id` est calculé par le cœur ;
  - `normalizeName()` conserve tiret et apostrophe (`jean-baptiste` ≠ `jean baptiste`),
    unifie leurs variantes typographiques, et transforme « œ » en « oe » ;
  - `DerivedField` accepte un `requires` optionnel, comme `Filter` et `Sort`.
- Modules factices `example` (source, champ calculé, filtre, tri) : à retirer quand les vrais
  modules arrivent (étapes 4, 6 et 7).
- Workflow : un commit qui ne modifie que `PROGRESS.md` ne redéploie plus, pour que le SHA de
  `#/dev` reste celui de l'étape.

### Étape 3 – 2026-11-12

- Commit `18153cf`, workflow vert. Vérifié par curl : `version.json` renvoie ce SHA,
  l'accueil et `data/insee.json` répondent 200.
- Source : `prenoms-2023-nat.csv` (naissances 1900–2023), seul fichier national proposé sur
  la page 8205621. Effectifs non arrondis dans cette édition.
- Résultat : 32 157 prénoms, 86 102 834 naissances, 3,26 Mo brut, 976 Ko gzip.
- Exclusions comptées dans `public/data/insee.report.json` : 39 704 lignes d'année inconnue
  (926 369 naissances), 248 lignes `_PRENOMS_RARES` (1 799 189 naissances), 2 123 prénoms qui
  n'ont aucune année connue.
- Choix : 3 486 graphies ne différant que par les accents (LEA, LÉA) sont fusionnées sous la
  plus fréquente, puisque l'identifiant d'un prénom est sa forme sans accents.
- Environnement cloud « Prenoms » créé pour autoriser `www.insee.fr` et
  `pierrecyrildecrock.github.io` : l'URL publiée est désormais vérifiable depuis la session.

### Étape 4 – 2026-11-13

- Commit `33f23a6`, workflow vert. Vérifié sur l'URL publiée avec un navigateur automatisé :
  `version.json` renvoie ce SHA, la progression avance de 0 à 100 %, 32 157 prénoms sont chargés
  (752 ms par le réseau, 236 ms depuis le cache après rechargement).
- Invalidation du cache : la source lit d'abord `insee.report.json` (bloc meta), et ne
  retélécharge `insee.json` que si la version de format ou la date de génération a changé.
- Ajouts au cœur, hors contrat d'origine : `mergeSources()` (fusion et champs calculés) et la
  méthode optionnelle `DataSource.clearCache()`, utilisée par le bouton « Vider le cache et
  recharger » de `#/dev`.
- Choix : `length` compte les lettres sans tiret, espace ni apostrophe ; `hasAccent` porte sur
  la forme affichée ; `peakYear` retient l'année la plus ancienne à égalité.
- Source et champ calculé factices `example` retirés ; restent le filtre et le tri factices.
- Compteur temporaire sur l'accueil, à retirer à l'étape 8.

### Étape 5 – 2026-11-13

- Commit `5de104e`, workflow vert. Vérifié sur l'URL publiée avec un navigateur automatisé :
  `version.json` renvoie ce SHA ; « lea » et « Léa » donnent les mêmes 33 résultats ; chaque
  recherche sur les 32 157 prénoms répond en moins de 5 ms.
- Test de performance : 5 filtres, une recherche et un tri sur 50 000 entrées synthétiques en
  6,8 ms (budget : 100 ms).
- Choix : `runQuery(entries, query, context)` reçoit les registres et les sources chargées par
  `context`, ce qui le garde pur et testable avec des modules factices ; sans tri, l'ordre
  d'entrée est conservé ; le départage alphabétique reste croissant même en tri décroissant.
- Aucun filtre ni tri réel créé à cette étape.

### Étape 6 – 2026-11-13

- Commit `9f4a648`, workflow vert. Vérifié sur l'URL publiée avec un navigateur automatisé :
  `version.json` renvoie ce SHA ; les 11 filtres s'affichent dans leurs 4 groupes ; chaque
  contrôle met à jour le compteur ; les combinaisons réduisent le résultat (par exemple filles
  16 834 → en hausse 6 054 → 5 000 naissances au moins 207 → pic dans les années 2020 : 72).
- Choix :
  - `gender` est un choix unique (filles, garçons, mixtes), avec le seuil de 20 % de `isMixed` ;
  - `trend` compare `facts.insee.recent` et `facts.insee.previous`, deux champs ajoutés aux
    faits INSEE et précalculés au chargement ; un prénom à égalité n'est ni en hausse ni en baisse ;
  - `periodPopularity` n'est actif que si le minimum est renseigné ; une borne d'année vide vaut
    le début ou la fin des données ;
  - `textSearch` existe comme filtre en plus de la recherche du pipeline (`query.search`).
- Code partagé hors de `src/filters/` (tout `.tsx` de ce dossier est pris pour un filtre) :
  `src/ui/controls.tsx` et `src/state/urlParams.ts`.
- Filtre factice `example` retiré ; reste le tri factice jusqu'à l'étape 7.
- `src/core` non modifié à cette étape.

### Étape 7 – 2026-11-13

- Commit `b4e595a`, workflow vert. Vérifié sur l'URL publiée avec un navigateur automatisé :
  `version.json` renvoie ce SHA ; les 6 tris donnent un ordre plausible dans les deux sens
  (popularité totale décroissante : Marie, Jean, Pierre, Michel ; popularité récente : Gabriel,
  Léo, Raphaël ; tendance décroissante : Eden, Liam, Mia), en 2 à 30 ms sur 32 157 prénoms.
- Preuve d'extensibilité : ajout temporaire de `src/sorts/vowelCount.ts`, puis lint, 311 tests
  et build verts, le tri étant présent dans le build. `git status --short` ne montrait que :

  ```text
  ?? src/sorts/vowelCount.ts
  ```

  Le fichier a ensuite été retiré.

- Défaut trouvé par cette preuve et corrigé : un test d'interface comptait exactement 6 tris
  (et 11 filtres). Il lit maintenant la taille des registres.
- Choix : `trend` trie sur la variation en nombre de naissances (10 dernières années moins les
  10 précédentes), pas en pourcentage, pour que les prénoms très rares ne dominent pas.
- Tri factice `example` retiré : il ne reste plus aucun module factice.
- `src/core` non modifié à cette étape.

### Étape 8 – 2026-11-13

- Commit `7e3956d`, workflow vert. Vérifié sur l'URL publiée avec un navigateur automatisé, à
  360 px et 1440 px, en thème clair et sombre : `version.json` renvoie ce SHA ; la liste affiche
  32 157 prénoms (Marie, Jean, Pierre en tête) avec moins de 30 lignes dans la page ; le tiroir
  occupe tout l'écran à 360 px ; la barre latérale est fixe à 1440 px ; un clic ouvre la fiche
  avec sa courbe ; aucun défilement horizontal ni erreur.
- Changement de contrat dans `src/core` : méthode optionnelle `Filter.describe(params)`, pour le
  texte des pastilles. Les 11 filtres l'implémentent.
- Choix :
  - `src/ui/inseeView.ts` est le seul fichier de l'interface qui lit les faits INSEE (total,
    répartition, séries) : le contrat ne décrit pas encore comment afficher une ligne ;
  - le tri par défaut est la popularité totale décroissante ;
  - dans la liste, le libellé de répartition est court (« 72 % filles ») ; la fiche donne les
    deux parts ;
  - le filtre `textSearch` est libellé « Texte supplémentaire », pour le distinguer de la
    recherche de l'en-tête ;
  - la position de défilement de la liste est retrouvée au retour d'une fiche.
- Non fait à cette étape, prévu plus tard : animations (étape 9), état dans l'URL et favoris
  (étape 10), audit axe et Lighthouse (étape 11).
- Compteur temporaire de l'étape 4 retiré de l'accueil.

### Étape 9 – 2026-11-13

- Commit `98fa48d`, workflow vert. Vérifié sur l'URL publiée avec un navigateur automatisé à
  360 px : `version.json` renvoie ce SHA ; les lignes conservées glissent, les nouvelles entrent
  en fondu, le compteur passe par des valeurs intermédiaires, la pastille sort avec un effet
  d'échelle, le tiroir suit le pointeur et se ferme en glissant, le défilement est conservé au
  changement de tri et retrouvé au retour d'une fiche, la copie affiche une notification. Avec
  « Réduire les animations » ou le réglage du système, plus aucune ligne ni le tiroir ne bouge.
- Fluidité mesurée sur l'URL publiée (navigateur de test sans carte graphique) :

  | Scénario                               | Processeur normal | Processeur ralenti 4 fois |
  | -------------------------------------- | ----------------- | ------------------------- |
  | Frappe rapide (« marie », puis efface) | 59 images/s       | 24 images/s               |
  | Changements de tri, liste complète     | 58 images/s       | 31 images/s               |

  À processeur ralenti, le rythme est le même avec les animations réduites (26 et 31) : ce ne
  sont pas les animations qui coûtent, mais le calcul et le dessin des lignes. Non mesuré sur un
  vrai téléphone.

- Simplifications faites après profilage, conformément à la règle de l'étape :
  - animations de disposition de Motion (`layout`) retirées des pastilles et du bloc de liste :
    elles forçaient un recalcul de mise en page à chaque frappe ;
  - position de la liste mesurée seulement quand ce qui la précède change de hauteur ;
  - tri de la liste complète fait une fois par tri, plus à chaque frappe ;
  - formatage des nombres avec des `Intl.NumberFormat` réutilisés.
- Choix et écarts :
  - favoris en mémoire seulement à cette étape (perdus au rechargement) ; la conservation et le
    filtre « Favoris » sont à l'étape 10 ;
  - « si plus de 200 lignes changent, désactive » : la liste étant virtualisée, seules une
    trentaine de lignes existent ; le seuil porte donc sur le nombre de lignes affichées ;
  - les pastilles voisines se replacent sans glisser quand l'une disparaît ;
  - les courbes « se tracent » par un dévoilement en `transform`, pas par `stroke-dashoffset` ;
  - bouton « Copier le prénom » placé sur la fiche.
- `src/core` non modifié à cette étape.

### Étape 10 – 2026-11-13

- Commit `cc6362e`, workflow vert. Vérifié sur l'URL publiée avec un navigateur automatisé :
  `version.json` renvoie ce SHA ; une vue filtrée et triée, rouverte par son URL dans un
  contexte vierge (équivalent d'un onglet privé), est strictement identique ; les paramètres
  invalides sont ignorés et l'URL remise au propre ; 3 frappes n'ajoutent aucune entrée
  d'historique, 3 filtres et 1 tri en ajoutent 4 ; les favoris survivent au rechargement ; le CSV
  téléchargé commence par un BOM UTF-8 ; le JSON contient les séries annuelles.
- Format du hash : `#/?q=mar&m=c&f.gender=f&f.length=3-6&s=alphabetical&d=asc`.
- Choix et écarts :
  - `pushState` pour mode, tri, sens et filtre ajouté ou retiré ; `replaceState` pour le texte
    recherché et pour la valeur d'un filtre déjà actif (sinon chaque chiffre tapé dans un champ
    de filtre créerait une entrée d'historique) ;
  - le lien de retour d'une fiche porte la vue en cours ; ouvrir `#/` nu remet la vue à zéro ;
  - les pastilles suivent l'ordre du registre, pas l'ordre d'activation, pour qu'une vue
    rouverte par lien soit identique ;
  - CSV : séparateur `;` et décimales à virgule (Excel en français), une colonne par champ
    calculé et par fait simple ; les séries annuelles ne sont que dans le JSON ;
  - nouveau groupe « Favoris » dans le panneau de filtres.
- Non vérifié : l'ouverture du CSV dans Excel lui-même (seuls le BOM et le contenu du fichier
  l'ont été).
- `src/core` non modifié à cette étape.

### Étape 11 – 2026-11-13

- Commit `65aa5c5`, workflow vert, `version.json` renvoie ce SHA.
- Scénarios Playwright (`npm run e2e`, `npm run e2e:live`) : 66 scénarios sur deux formats
  (mobile Pixel 7, desktop 1440 px). **63 passent en local et contre l'URL publiée** ; les 3
  autres sont volontairement limités à un format (raccourci « / », focus au clavier et lien
  d'évitement : desktop seulement).
- Lighthouse mobile sur l'URL publiée (navigateur de test, 3 passes pour la liste) :

  | Page                      | Performance | Accessibilité | Bonnes pratiques |
  | ------------------------- | ----------- | ------------- | ---------------- |
  | Liste (`#/`)              | 94, 95, 99  | 100           | 100              |
  | Fiche ouverte directement | 77          | 100           | 100              |

  Avant corrections, la liste était à 87 en performance.

- Audit axe (WCAG 2.1 A et AA, bonnes pratiques) sur 7 écrans, en clair et en sombre, aux deux
  formats : **aucune violation** après corrections. Aucun défaut de contraste relevé.
- Performance sur les données réelles (URL publiée) : premier affichage en 1,3 à 1,5 s, 0,5 s
  depuis le cache ; une frappe, un effacement ou un filtre répondent en 9 à 22 ms (budget :
  100 ms). Le pipeline n'a donc pas été déplacé dans un Web Worker.
- Corrigé :
  - ordre des titres sur ordinateur : titre « Filtres » ajouté au-dessus des groupes ;
  - blocs défilants non atteignables au clavier sur la page de diagnostic ;
  - nom lu du bouton « Effacer » d'un filtre (trouvé à l'étape 8, vérifié ici) ;
  - lien d'évitement « Aller aux résultats » : sans lui, il fallait plus de 45 tabulations sur
    ordinateur pour atteindre un prénom ;
  - chargement qui bloquait l'interface environ 0,5 s sur mobile simulé : traitement par tranches
    de 8 ms (`runInSlices`), calcul des faits en une passe, données livrées triées par
    popularité, cache stocké en texte, page de diagnostic chargée à la demande ;
  - requête en erreur sur `favicon.ico` (icône provisoire vide ; la vraie arrive à l'étape 12).
- Non corrigé, et pourquoi :
  - fiche ouverte directement, performance 77 : son contenu attend le téléchargement de toutes
    les données (0,9 Mo, environ 6 s sur la 4G lente simulée par Lighthouse). Y remédier
    demanderait un fichier par prénom, hors périmètre. Les visites suivantes utilisent le cache ;
  - JavaScript inutilisé signalé par Lighthouse (environ 75 Ko) : Motion et React, sans effet sur
    le score atteint ;
  - les scénarios de bout en bout ne tournent pas dans le workflow de déploiement (installer un
    navigateur l'allongerait) : ils sont à lancer à la main ;
  - fluidité à processeur ralenti 4 fois (mesurée à l'étape 9) : non remesurée ici ; le coût par
    frappe a encore baissé (une clé par prénom n'est plus recalculée), sans mesure sur téléphone.
- Changements dans `src/core`, sans toucher aux contrats : `slices.ts` (travail par tranches),
  `mergeSourcesSteps`, chemin rapide dans `normalizeName`.
- Données régénérées (ordre par popularité) : 908 Ko gzip au lieu de 976 ; sommes identiques au
  CSV.

### Étape 12 – 2026-11-13

- Commits `89b059e` (finitions) et `6f64a93` (correction de tests), workflow vert, `version.json`
  renvoie `6f64a93`.
- Vérifié sur l'URL publiée :
  - `og.png`, `favicon.svg`, les trois icônes PNG et `manifest.webmanifest` répondent 200 ;
  - `data/insee.json` répond 200 ; `data/raw/prenoms-2023-nat.csv` et `data/raw/` répondent 404 ;
  - le HTML servi contient le titre, la description et les balises Open Graph, avec des adresses
    absolues vers `https://pierrecyrildecrock.github.io/Prenoms/` ;
  - 71 scénarios Playwright passent (74 au total, 3 limités à un format), dont 4 nouveaux sur la
    publication.
- Licence des données vérifiée sur les mentions légales de l'Insee
  (https://www.insee.fr/fr/information/2008466) : Licence Ouverte / Open Licence 2.0 (Etalab),
  réutilisation libre avec mention « Source : Insee » et de la date de mise à jour. La page du
  jeu de données ne porte pas de mention contraire. Le crédit figure dans le pied de page et le
  README.
- README : description, 7 captures (`docs/img/`), URL, commandes, régénération des données,
  architecture, crédits et licence. Un test vérifie que ses liens internes pointent vers des
  fichiers existants.
- Rien de temporaire ne restait sur l'accueil ; l'icône provisoire de l'étape 11 est remplacée.
  `#/dev` reste accessible par le lien « Diagnostic » du pied de page.
- Choix et écarts :
  - le README ne renvoie pas encore aux guides d'extension : ils sont écrits à l'étape 13 ;
  - non vérifié : l'aperçu réel dans une messagerie (seules les balises et l'image servies l'ont
    été) et le rendu du README sur GitHub ;
  - aucune licence n'est déclarée pour le code du dépôt : c'est une décision qui vous revient ;
  - l'adresse publique vit dans `.env` (`VITE_SITE_URL`) ; à changer si le site déménage.
- Défaut de test corrigé : les scénarios de publication interrogeaient le serveur hors du
  navigateur, ce qui échouait contre le site publié depuis l'environnement de développement.

### Étape 13 – 2026-11-13

- Commits `0b8506e` (guides), `4b789ae` (tests), `b54c697` (preuve), `f38ce14` (retrait de la
  démo), `d909bc7` (section `#/dev`). Workflow vert, `version.json` renvoie `d909bc7`.
- Guides : `docs/ajouter-une-source.md`, `docs/ajouter-un-filtre.md`, `docs/ajouter-un-tri.md`,
  chacun avec le contrat, les règles, un exemple complet et la liste exacte des fichiers à créer.
  Ils sont reliés au README et à `CLAUDE.md`.
- Méthode de la preuve : les 7 fichiers de la démo ont été créés par un script qui recopie les
  blocs de code des guides, sans aucune retouche (contrôle `cmp` : identiques).
- **Première tentative : 21 tests en échec**, sans qu'aucun code de l'application ne soit en
  cause :
  - 3 tests supposaient que les registres ne contiennent que les filtres de la v1 (groupe connu,
    source INSEE obligatoire, un jeu d'essai d'URL par filtre) ;
  - 18 tests d'interface supposaient que l'INSEE est la seule source : les prénoms de la démo
    s'ajoutaient à leurs 3 prénoms d'essai.

  Correction (commit `4b789ae`, avant la preuve) : vérifications propres à la v1 limitées aux
  modules livrés, tests d'interface limités à la source INSEE (`src/testing/registries.ts`),
  décomptes faits sur les modules disponibles. Cela modifie des fichiers de test, dont deux dans
  `src/ui` ; aucun fichier de code de `src/core` ni de `src/ui`.

- **Deuxième tentative, avec les mêmes fichiers** : types, lint, 469 tests, build et 71 scénarios
  Playwright verts. `git diff --stat` du commit de preuve `b54c697` :

  ```text
   src/filters/demoOrigin.test.tsx | 41 +++++++++++++++++++++++++++++++++++++++++
   src/filters/demoOrigin.tsx      | 37 +++++++++++++++++++++++++++++++++++++
   src/sorts/demoSyllables.test.ts | 26 ++++++++++++++++++++++++++
   src/sorts/demoSyllables.ts      | 12 ++++++++++++
   src/sources/demo/facts.ts       | 19 +++++++++++++++++++
   src/sources/demo/index.test.ts  | 20 ++++++++++++++++++++
   src/sources/demo/index.ts       | 34 ++++++++++++++++++++++++++++++++++
   7 files changed, 189 insertions(+)
  ```

  Aucun fichier de `src/core` ni de `src/ui`.

- Vérifié dans le site construit avec la démo : groupe « Démo » dans le panneau ; filtre origine
  hébraïque = 5 prénoms (Marie, Jean, Léa, Gabriel, Nathan) avec sa pastille ; tri « Syllabes
  (démo) » décroissant = Gabriel en tête ; lien partagé identique ; colonnes `demo.origin` et
  `demo.syllables` dans l'export CSV ; source listée sur `#/dev`.
- Démo retirée ensuite (commit `f38ce14`) : la preuve reste dans l'historique et dans les
  exemples des guides. Site publié vérifié : aucun groupe ni tri démo, `#/dev` indique « source
  factice demo absente », 71 scénarios Playwright verts.
- Précisions ajoutées aux guides après la preuve : la forme affichée d'un prénom vient de la
  première source dans l'ordre alphabétique des dossiers ; groupes et filtres suivent l'ordre
  alphabétique des fichiers.
- Limites restantes, notées dans les guides ou relevées ici :
  - les lignes et la fiche n'affichent que les statistiques INSEE (`src/ui/inseeView.ts`) : afficher
    les faits d'une nouvelle source demande de modifier `src/ui` ;
  - les groupes du panneau suivent l'ordre des fichiers (Forme apparaît en premier), pas un ordre
    choisi ;
  - un lien qui ne contient que des paramètres inconnus (par exemple un ancien lien de la démo)
    affiche la bonne vue, mais l'adresse n'est pas nettoyée.
