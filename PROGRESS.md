# Avancement

URL publiée : https://pierrecyrildecrock.github.io/Prenoms/

| N°  | Étape                                   | Statut   | Date       | Commit    | URL de vérification                                |
| --- | --------------------------------------- | -------- | ---------- | --------- | -------------------------------------------------- |
| 1   | Initialisation et déploiement           | terminée | 2026-11-12 | `d282967` | https://pierrecyrildecrock.github.io/Prenoms/#/dev |
| 2   | Contrats du cœur                        | terminée | 2026-11-12 | `9b7f058` | https://pierrecyrildecrock.github.io/Prenoms/#/dev |
| 3   | Pipeline de données INSEE               | terminée | 2026-11-12 | `18153cf` | https://pierrecyrildecrock.github.io/Prenoms/#/dev |
| 4   | Source INSEE dans le navigateur         | terminée | 2026-11-13 | `33f23a6` | https://pierrecyrildecrock.github.io/Prenoms/#/dev |
| 5   | Moteur de requête                       | terminée | 2026-11-13 | `5de104e` | https://pierrecyrildecrock.github.io/Prenoms/#/dev |
| 6   | Filtres de la v1                        | à faire  |            |           |                                                    |
| 7   | Tris de la v1                           | à faire  |            |           |                                                    |
| 8   | Interface : structure et lisibilité     | à faire  |            |           |                                                    |
| 9   | Animations et interactions              | à faire  |            |           |                                                    |
| 10  | État dans l'URL, favoris, export        | à faire  |            |           |                                                    |
| 11  | Tests, performance, accessibilité       | à faire  |            |           |                                                    |
| 12  | Finitions de publication                | à faire  |            |           |                                                    |
| 13  | Documentation et preuve d'extensibilité | à faire  |            |           |                                                    |

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
