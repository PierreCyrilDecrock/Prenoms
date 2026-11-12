# Avancement

URL publiée : https://pierrecyrildecrock.github.io/Prenoms/

| N°  | Étape                                   | Statut   | Date       | Commit    | URL de vérification                                |
| --- | --------------------------------------- | -------- | ---------- | --------- | -------------------------------------------------- |
| 1   | Initialisation et déploiement           | terminée | 2026-11-12 | `d282967` | https://pierrecyrildecrock.github.io/Prenoms/#/dev |
| 2   | Contrats du cœur                        | terminée | 2026-11-12 | `9b7f058` | https://pierrecyrildecrock.github.io/Prenoms/#/dev |
| 3   | Pipeline de données INSEE               | à faire  |            |           |                                                    |
| 4   | Source INSEE dans le navigateur         | à faire  |            |           |                                                    |
| 5   | Moteur de requête                       | à faire  |            |           |                                                    |
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
