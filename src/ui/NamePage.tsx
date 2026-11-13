import { useEffect, useMemo, type ReactNode } from 'react';
import { useNamesStore } from '@/state/namesStore';
import { NAME_TRANSITION, useNavStore } from '@/state/navStore';
import { haptic } from '@/state/settingsStore';
import { useToastStore } from '@/state/toastStore';
import { FavoriteButton } from '@/ui/FavoriteButton';
import { copyText } from '@/ui/clipboard';
import { PageTransition } from '@/ui/motion';
import { GenderBar } from '@/ui/explorer/GenderBar';
import { buttonClass, ErrorState, LoadingState, primaryButtonClass } from '@/ui/explorer/States';
import { YearChart } from '@/ui/explorer/YearChart';
import { formatInt } from '@/ui/format';
import { getNameStats } from '@/ui/inseeView';

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-card border border-line bg-surface-raised p-4">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="mt-1 text-xl font-semibold">{children}</dd>
    </div>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <PageTransition>
      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-4">
        <nav aria-label="Navigation">
          <a href="#/" className="inline-flex min-h-11 items-center text-accent underline">
            ← Tous les prénoms
          </a>
        </nav>
        {children}
      </div>
    </PageTransition>
  );
}

/** Fiche d'un prénom : courbe annuelle par sexe, pic, première et dernière année, répartition. */
export function NamePage({ id }: { id: string }) {
  const status = useNamesStore((state) => state.status);
  const error = useNamesStore((state) => state.error);
  const load = useNamesStore((state) => state.load);
  const entry = useNamesStore((state) => state.entries.find((item) => item.id === id));
  const stats = useMemo(() => (entry ? getNameStats(entry) : undefined), [entry]);
  const bySex = useMemo(() => stats?.yearlyBySex(), [stats]);

  const showToast = useToastStore((state) => state.show);

  useEffect(() => {
    window.scrollTo(0, 0);
    // Au retour, la ligne de ce prénom reprend la place du titre.
    useNavStore.getState().setLastOpened(id);
  }, [id]);

  const copyName = async (label: string) => {
    const copied = await copyText(label);
    showToast(copied ? `« ${label} » copié` : 'Copie impossible dans ce navigateur');
    if (copied) haptic();
  };

  useEffect(() => {
    document.title = entry ? `${entry.label} – Explorateur de prénoms` : 'Explorateur de prénoms';
  }, [entry]);

  if (status === 'loading' || status === 'idle') {
    return (
      <Shell>
        <LoadingState />
      </Shell>
    );
  }
  if (status === 'error') {
    return (
      <Shell>
        <ErrorState message={error} onRetry={() => void load()} />
      </Shell>
    );
  }
  if (!entry) {
    return (
      <Shell>
        <main className="flex flex-col items-start gap-4 py-8">
          <h1 className="text-2xl font-semibold">Prénom introuvable</h1>
          <p className="text-ink-muted">
            Aucun prénom ne correspond à « {id} » dans les données chargées.
          </p>
          <a href="#/" className={primaryButtonClass}>
            Revenir à la liste
          </a>
        </main>
      </Shell>
    );
  }

  return (
    <Shell>
      <main className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold tracking-tight break-words sm:text-5xl">
            <span style={{ viewTransitionName: NAME_TRANSITION }}>{entry.label}</span>
          </h1>
          {stats && (
            <p className="text-lg text-ink-muted">
              {formatInt(stats.total)} naissances de {stats.firstYear} à {stats.lastYear}
            </p>
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void copyName(entry.label)}
              className={buttonClass}
            >
              Copier le prénom
            </button>
            <FavoriteButton id={entry.id} label={entry.label} />
          </div>
        </header>

        {!stats && <p className="text-ink-muted">Aucune statistique pour ce prénom.</p>}

        {stats && bySex && (
          <>
            <section aria-labelledby="chart-title" className="flex flex-col gap-2">
              <h2 id="chart-title" className="text-lg font-semibold">
                Naissances par année
              </h2>
              <YearChart
                startYear={stats.startYear}
                female={bySex.female}
                male={bySex.male}
                label={`Naissances par année du prénom ${entry.label}, par sexe. Pic en ${stats.peakYear} avec ${formatInt(stats.peakCount)} naissances.`}
              />
            </section>

            <section aria-labelledby="split-title" className="flex flex-col gap-2">
              <h2 id="split-title" className="text-lg font-semibold">
                Répartition
              </h2>
              <GenderBar femaleShare={stats.femaleShare} wide />
              <p className="text-sm text-ink-muted">
                {formatInt(stats.female)} filles · {formatInt(stats.male)} garçons
              </p>
            </section>

            <section aria-labelledby="facts-title" className="flex flex-col gap-2">
              <h2 id="facts-title" className="text-lg font-semibold">
                Repères
              </h2>
              <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stat label="Pic">
                  {stats.peakYear}
                  <span className="block text-sm font-normal text-ink-muted">
                    {formatInt(stats.peakCount)} naissances
                  </span>
                </Stat>
                <Stat label="Première année">{stats.firstYear}</Stat>
                <Stat label="Dernière année">{stats.lastYear}</Stat>
                <Stat label="Total">{formatInt(stats.total)}</Stat>
              </dl>
            </section>
          </>
        )}
      </main>
    </Shell>
  );
}
