import type { ReactNode } from 'react';
import { ROW_HEIGHT } from './ResultRow';

export const buttonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-card border border-line bg-surface-raised px-4 font-medium transition-transform duration-fast ease-soft active:scale-[0.98] disabled:opacity-50';

export const primaryButtonClass =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-card bg-accent px-4 font-medium text-accent-ink transition-transform duration-fast ease-soft active:scale-[0.98]';

/** Squelettes affichés pendant le chargement des prénoms. */
export function LoadingState() {
  return (
    <div role="status" aria-label="Chargement des prénoms">
      {Array.from({ length: 10 }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 border-b border-line px-4"
          style={{ height: ROW_HEIGHT }}
        >
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-5 w-32 animate-pulse rounded bg-surface-sunken" />
            <div className="h-2 w-24 animate-pulse rounded bg-surface-sunken" />
          </div>
          <div className="h-7 w-18 animate-pulse rounded bg-surface-sunken sm:w-28" />
          <div className="h-5 w-16 animate-pulse rounded bg-surface-sunken" />
        </div>
      ))}
    </div>
  );
}

function Message({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 px-4 py-16 text-center">
      <h2 className="text-xl font-semibold">{title}</h2>
      {children}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string | null; onRetry(): void }) {
  return (
    <div role="alert">
      <Message title="Les prénoms n’ont pas pu être chargés">
        <p className="max-w-md text-ink-muted">
          Vérifiez votre connexion, puis réessayez.
          {message && <span className="mt-1 block text-sm">Détail : {message}</span>}
        </p>
        <button type="button" onClick={onRetry} className={primaryButtonClass}>
          Réessayer
        </button>
      </Message>
    </div>
  );
}

export function EmptyState({ onReset }: { onReset(): void }) {
  return (
    <Message title="Aucun prénom ne correspond">
      <p className="max-w-md text-ink-muted">
        Essayez un texte plus court, un autre mode de recherche, ou retirez un filtre.
      </p>
      <button type="button" onClick={onReset} className={primaryButtonClass}>
        Tout réinitialiser
      </button>
    </Message>
  );
}
