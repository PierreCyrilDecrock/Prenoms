import { useEffect, useRef } from 'react';
import type { SearchMode } from '@/core';
import { useQueryStore } from '@/state/queryStore';
import { plural } from '@/ui/format';
import { AnimatedNumber } from '@/ui/motion';
import { buttonClass } from './States';

const modes: { id: SearchMode; label: string }[] = [
  { id: 'startsWith', label: 'Commence par' },
  { id: 'contains', label: 'Contient' },
  { id: 'endsWith', label: 'Finit par' },
];

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

interface Props {
  /** Nombre de résultats, ou null tant que les prénoms ne sont pas chargés. */
  count: number | null;
  activeFilterCount: number;
  /** Ouvre le tiroir de filtres ; absent sur desktop, où les filtres sont en barre latérale. */
  onOpenFilters?: () => void;
}

/** En-tête fixe : recherche, mode, compteur de résultats et bouton des filtres (mobile). */
export function Header({ count, activeFilterCount, onOpenFilters }: Props) {
  const search = useQueryStore((state) => state.search);
  const mode = useQueryStore((state) => state.mode);
  const setSearch = useQueryStore((state) => state.setSearch);
  const setMode = useQueryStore((state) => state.setMode);
  const inputRef = useRef<HTMLInputElement>(null);

  // Raccourci « / » : placer le curseur dans la recherche.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
      if (isTyping(event.target)) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-2 lg:h-18 lg:flex-row lg:items-center lg:gap-4 lg:py-0">
        <h1 className="sr-only lg:not-sr-only lg:w-72 lg:shrink-0 lg:text-lg lg:font-semibold">
          Explorateur de prénoms
        </h1>

        <div className="relative flex-1">
          <label htmlFor="search" className="sr-only">
            Rechercher un prénom
          </label>
          <input
            id="search"
            ref={inputRef}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && search !== '') {
                event.stopPropagation();
                setSearch('');
              }
            }}
            placeholder="Rechercher"
            autoCapitalize="off"
            autoCorrect="off"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="search"
            aria-keyshortcuts="/"
            className="min-h-12 w-full rounded-card border border-line bg-surface-raised pr-32 pl-4 text-lg placeholder:text-ink-muted"
          />
          {/* Le nombre animé est décoratif ; le texte exact est annoncé à côté. */}
          <p
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-4 flex items-center gap-1 text-sm text-ink-muted"
          >
            {count !== null && (
              <>
                <AnimatedNumber value={count} /> {count > 1 ? 'prénoms' : 'prénom'}
              </>
            )}
          </p>
          <p role="status" data-testid="result-count" className="sr-only">
            {count === null ? '' : plural(count, 'prénom')}
          </p>
        </div>

        <div className="flex gap-2">
          <label htmlFor="search-mode" className="sr-only">
            Mode de recherche
          </label>
          <select
            id="search-mode"
            value={mode}
            onChange={(event) => setMode(event.target.value as SearchMode)}
            className="min-h-11 flex-1 rounded-card border border-line bg-surface-raised px-3 lg:flex-none"
          >
            {modes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          {onOpenFilters && (
            <button type="button" onClick={onOpenFilters} className={buttonClass}>
              Filtres
              {activeFilterCount > 0 && (
                <span
                  className="inline-flex min-w-6 justify-center rounded-full bg-accent px-1.5 text-sm text-accent-ink"
                  aria-label={`${plural(activeFilterCount, 'filtre actif', 'filtres actifs')}`}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>
          )}
        </div>

        <p className="hidden shrink-0 text-sm text-ink-muted xl:block">
          <kbd className="rounded border border-line px-1.5 py-0.5">/</kbd> chercher ·{' '}
          <kbd className="rounded border border-line px-1.5 py-0.5">Échap</kbd> effacer
        </p>
      </div>
    </header>
  );
}
