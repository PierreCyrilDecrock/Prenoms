import { motion } from 'motion/react';
import { useNamesStore } from '@/state/namesStore';
import { durations, easings } from '@/ui/tokens';

export function HomePage() {
  const status = useNamesStore((state) => state.status);
  const count = useNamesStore((state) => state.entries.length);
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: durations.slow, ease: easings.soft }}
        className="flex flex-col gap-4"
      >
        <p className="text-sm font-medium text-accent">En construction</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Explorateur de prénoms
        </h1>
        <p className="text-lg text-ink-muted">
          Rechercher, filtrer et trier les prénoms donnés en France depuis 1900, à partir des
          données de l’INSEE. Tout se passe dans votre navigateur.
        </p>
      </motion.div>
      {/* Temporaire (étape 4) : sera remplacé par l'application à l'étape 8. */}
      <p aria-live="polite" data-testid="home-count" className="text-ink-muted">
        {status === 'ready' && `${count.toLocaleString('fr-FR')} prénoms chargés.`}
        {status === 'loading' && 'Chargement des prénoms…'}
        {status === 'error' && 'Les prénoms n’ont pas pu être chargés.'}
      </p>
      <p>
        <a
          href="#/dev"
          className="inline-flex min-h-11 items-center rounded-card bg-accent px-4 font-medium text-accent-ink transition-transform duration-fast ease-soft active:scale-[0.98]"
        >
          Page de diagnostic
        </a>
      </p>
    </main>
  );
}
