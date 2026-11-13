import { useNamesStore } from '@/state/namesStore';
import { nameHref } from '@/ui/explorer/ResultRow';
import { DESKTOP_QUERY, useMediaQuery } from '@/ui/useMediaQuery';

const EXAMPLES = ['marie', 'camille', 'lea', 'jean-baptiste', 'mila'];

/** Section « Étape 8 » de la page de diagnostic : accès à l'interface et contexte d'affichage. */
export function DevStep8() {
  const entries = useNamesStore((state) => state.entries);
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const isDark = useMediaQuery('(prefers-color-scheme: dark)');
  const examples = EXAMPLES.flatMap((id) => entries.find((entry) => entry.id === id) ?? []);

  return (
    <div className="flex flex-col gap-4">
      <dl>
        <div className="flex gap-4 border-b border-line py-2">
          <dt className="w-40 shrink-0 text-ink-muted">Mise en page</dt>
          <dd className="font-medium" data-testid="layout-mode">
            {isDesktop
              ? 'ordinateur : filtres en barre latérale fixe'
              : 'téléphone : filtres dans un tiroir plein écran'}
          </dd>
        </div>
        <div className="flex gap-4 py-2">
          <dt className="w-40 shrink-0 text-ink-muted">Thème de l’appareil</dt>
          <dd className="font-medium">{isDark ? 'sombre' : 'clair'}</dd>
        </div>
      </dl>
      <p>
        <a href="#/" className="inline-flex min-h-11 items-center text-accent underline">
          Ouvrir l’application
        </a>
      </p>
      {examples.length > 0 && (
        <div>
          <h3 className="mb-2 font-medium">Fiches d’exemple</h3>
          <ul className="flex flex-wrap gap-2">
            {examples.map((entry) => (
              <li key={entry.id}>
                <a
                  href={nameHref(entry.id)}
                  className="inline-flex min-h-11 items-center rounded-card border border-line px-4"
                >
                  {entry.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
