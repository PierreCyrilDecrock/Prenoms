import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useNamesStore } from '@/state/namesStore';
import { useQueryStore } from '@/state/queryStore';
import { useResults } from '@/state/useResults';
import { DESKTOP_QUERY, useMediaQuery } from '@/ui/useMediaQuery';
import { ActiveChips } from './ActiveChips';
import { FilterDrawer } from './FilterDrawer';
import { FilterPanel } from './FilterPanel';
import { Header } from './Header';
import { ResultList } from './ResultList';
import { SortControls } from './SortControls';
import { EmptyState, ErrorState, LoadingState } from './States';

/** Position de défilement de la liste, retrouvée au retour d'une fiche. */
let savedScroll = 0;

/** Page d'accueil : l'application de recherche, de filtrage et de tri. */
export function ExplorerPage() {
  const status = useNamesStore((state) => state.status);
  const error = useNamesStore((state) => state.error);
  const load = useNamesStore((state) => state.load);
  const search = useQueryStore((state) => state.search);
  const mode = useQueryStore((state) => state.mode);
  const resetAll = useQueryStore((state) => state.resetAll);
  const { results, active, isFiltered } = useResults();
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const ready = status === 'ready';

  useEffect(() => {
    document.title = 'Explorateur de prénoms';
  }, []);

  useLayoutEffect(() => {
    if (ready && savedScroll > 0) window.scrollTo(0, savedScroll);
    const remember = () => {
      savedScroll = window.scrollY;
    };
    window.addEventListener('scroll', remember, { passive: true });
    return () => window.removeEventListener('scroll', remember);
  }, [ready]);

  return (
    <div className="flex min-h-dvh flex-col">
      <Header
        count={ready ? results.length : null}
        activeFilterCount={active.length}
        onOpenFilters={isDesktop ? undefined : () => setDrawerOpen(true)}
      />

      <div className="mx-auto w-full max-w-7xl flex-1 lg:grid lg:grid-cols-[20rem_minmax(0,1fr)]">
        {isDesktop && (
          <aside
            aria-label="Filtres"
            className="sticky top-18 h-[calc(100dvh-4.5rem)] overflow-y-auto border-r border-line px-4 py-4"
          >
            <FilterPanel />
          </aside>
        )}

        <main className="min-w-0">
          <div className="flex justify-end px-4 pt-2">
            <SortControls />
          </div>
          <ActiveChips active={active} canReset={isFiltered} />
          <div className="mt-2 border-t border-line">
            {(status === 'loading' || status === 'idle') && <LoadingState />}
            {status === 'error' && <ErrorState message={error} onRetry={() => void load()} />}
            {ready && results.length === 0 && <EmptyState onReset={resetAll} />}
            {ready && results.length > 0 && (
              <ResultList results={results} search={search} mode={mode} />
            )}
          </div>
        </main>
      </div>

      <footer className="border-t border-line px-4 py-4 text-center text-sm text-ink-muted">
        Données : INSEE, fichier des prénoms ·{' '}
        <a href="#/dev" className="inline-flex min-h-11 items-center underline">
          Diagnostic
        </a>
      </footer>

      {!isDesktop && drawerOpen && (
        <FilterDrawer
          resultCount={results.length}
          canReset={isFiltered}
          onReset={resetAll}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
}
