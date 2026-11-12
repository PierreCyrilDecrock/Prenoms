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

| Commande          | Effet                                              |
| ----------------- | -------------------------------------------------- |
| `npm run dev`     | Serveur de développement                           |
| `npm run build`   | Vérification des types puis build dans `dist/`     |
| `npm run preview` | Sert `dist/` (ajouter `--base /Prenoms/` au build) |
| `npm test`        | Tests Vitest + Testing Library                     |
| `npm run lint`    | ESLint + vérification Prettier                     |
| `npm run format`  | Formate avec Prettier                              |

Test local sous sous-chemin : `VITE_BASE=/Prenoms/ npm run build && VITE_BASE=/Prenoms/ npm run preview`.

## Règle d'or

`src/core` ne dépend jamais d'une source, d'un filtre ou d'un tri précis (ESLint le vérifie).
On étend l'application en **ajoutant un fichier** dans `src/sources/`, `src/derived/`,
`src/filters/` ou `src/sorts/` ; les registres les découvrent avec `import.meta.glob`.
Ne modifie jamais `src/core` pour ajouter une source, un filtre ou un tri : si c'est inévitable,
dis-le clairement et corrige l'architecture plutôt que de la contourner.

Autres règles :

- Un prénom est identifié par sa forme normalisée (minuscules, sans accents).
- Chaque source range ses données sous sa propre clé dans `facts`.
- Un filtre ou un tri déclare les sources requises (`requires`).
- `src/ui` ne contient aucune logique métier.

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
