import { sources } from '@/core';

const REPO = 'https://github.com/PierreCyrilDecrock/Prenoms';
const PROOF_COMMIT = 'b54c697';

const GUIDES = [
  { file: 'ajouter-une-source.md', label: 'Ajouter une source de données' },
  { file: 'ajouter-un-filtre.md', label: 'Ajouter un filtre' },
  { file: 'ajouter-un-tri.md', label: 'Ajouter un tri' },
];

/** Fichiers ajoutés par la preuve d'extensibilité (git diff --stat du commit de preuve). */
const PROOF_STAT = [
  ['src/filters/demoOrigin.test.tsx', 41],
  ['src/filters/demoOrigin.tsx', 37],
  ['src/sorts/demoSyllables.test.ts', 26],
  ['src/sorts/demoSyllables.ts', 12],
  ['src/sources/demo/facts.ts', 19],
  ['src/sources/demo/index.test.ts', 20],
  ['src/sources/demo/index.ts', 34],
] as const;

/** Section « Étape 13 » de la page de diagnostic : guides, preuve d'extensibilité, sources actives. */
export function DevStep13() {
  const registered = sources.all().map((source) => source.id);
  const demoAbsent = !registered.includes('demo');

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2 font-medium">Guides d’extension</h3>
        <ul className="flex flex-col">
          {GUIDES.map((guide) => (
            <li key={guide.file}>
              <a
                href={`${REPO}/blob/main/docs/${guide.file}`}
                className="inline-flex min-h-11 items-center text-accent underline"
              >
                {guide.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium">Preuve d’extensibilité</h3>
        <p className="mb-2 text-sm text-ink-muted">
          Source, filtre et tri « demo » recopiés tels quels depuis les guides, puis retirés.{' '}
          <a href={`${REPO}/commit/${PROOF_COMMIT}`} className="text-accent underline">
            Commit {PROOF_COMMIT}
          </a>{' '}
          : aucun fichier de <code>src/core</code> ni de <code>src/ui</code>.
        </p>
        <pre
          data-testid="proof-stat"
          className="rounded-card bg-surface-sunken p-3 text-xs break-all whitespace-pre-wrap"
        >
          {PROOF_STAT.map(([file, lines]) => `${file} | ${lines} +`).join('\n')}
          {`\n${PROOF_STAT.length} fichiers ajoutés, ${PROOF_STAT.reduce((sum, [, lines]) => sum + lines, 0)} lignes`}
        </pre>
      </div>

      <div>
        <h3 className="mb-2 font-medium">Sources chargées par ce site</h3>
        <p data-testid="registered-sources">
          {registered.join(', ')} ·{' '}
          <strong className={demoAbsent ? 'text-success' : 'text-danger'}>
            {demoAbsent ? 'source factice « demo » absente' : 'source factice « demo » présente'}
          </strong>
        </p>
      </div>
    </div>
  );
}
