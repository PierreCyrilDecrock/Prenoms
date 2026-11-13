import { useFavoritesStore } from '@/state/favoritesStore';
import { useQueryStore } from '@/state/queryStore';
import { listHref } from '@/state/urlState';
import { useResults } from '@/state/useResults';
import { ExportMenu } from '@/ui/explorer/ExportMenu';
import { plural } from '@/ui/format';

const EXAMPLES = [
  {
    label: 'Filles en hausse, finissant par « a », tri par popularité récente',
    href: '#/?q=a&m=e&f.gender=f&f.trend=up&s=recentPopularity&d=desc',
  },
  {
    label: 'Prénoms mixtes de 4 à 6 lettres, pic dans les années 1990, ordre alphabétique',
    href: '#/?f.length=4-6&f.gender=x&f.peakPeriod=1990-1999&s=alphabetical&d=asc',
  },
  {
    label: 'Lien avec des paramètres invalides (ils sont ignorés)',
    href: '#/?q=lou&f.gender=zzz&f.inconnu=1&s=nimporte&m=x',
  },
  { label: 'Favoris uniquement', href: '#/?f.favorites=only' },
];

/** Section « Étape 10 » de la page de diagnostic : état dans l'URL, favoris, export. */
export function DevStep10() {
  const currentHref = useQueryStore(listHref);
  const favoriteIds = useFavoritesStore((state) => state.ids);
  const clearFavorites = useFavoritesStore((state) => state.clear);
  const { results } = useResults();
  const favorites = Object.keys(favoriteIds);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="mb-2 font-medium">État dans l’URL</h3>
        <p className="text-sm text-ink-muted">Vue en cours (recherche, filtres, tri) :</p>
        <p>
          <a
            href={currentHref}
            data-testid="current-href"
            className="inline-flex min-h-11 items-center break-all text-accent underline"
          >
            {currentHref}
          </a>
        </p>
        <p className="mt-2 text-sm text-ink-muted">Liens d’exemple :</p>
        <ul className="flex flex-col">
          {EXAMPLES.map((example) => (
            <li key={example.href}>
              <a
                href={example.href}
                className="inline-flex min-h-11 items-center text-accent underline"
              >
                {example.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium">Favoris conservés sur cet appareil</h3>
        <p data-testid="favorites-count">
          <strong>{plural(favorites.length, 'favori')}</strong>
          {favorites.length > 0 && ` : ${favorites.slice(0, 20).join(', ')}`}
          {favorites.length > 20 && '…'}
        </p>
        <button
          type="button"
          onClick={clearFavorites}
          disabled={favorites.length === 0}
          className="pressable mt-2 min-h-11 rounded-card border border-line px-4 font-medium disabled:opacity-50"
        >
          Vider les favoris
        </button>
      </div>

      <div>
        <h3 className="mb-2 font-medium">Export de la vue en cours</h3>
        <p className="mb-2 text-sm text-ink-muted">
          {plural(results.length, 'prénom')} dans la vue en cours. CSV : UTF-8 avec BOM, séparateur
          « ; ». JSON : séries annuelles comprises.
        </p>
        <ExportMenu results={results} />
      </div>
    </div>
  );
}
