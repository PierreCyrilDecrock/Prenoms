import { useEffect, useRef } from 'react';
import { plural } from '@/ui/format';
import { FilterPanel } from './FilterPanel';
import { buttonClass, primaryButtonClass } from './States';

interface Props {
  resultCount: number;
  canReset: boolean;
  onReset(): void;
  onClose(): void;
}

/** Tiroir de filtres plein écran (mobile). */
export function FilterDrawer({ resultCount, canReset, onReset, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      // Le focus reste dans le tiroir.
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input, select, a[href]',
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
      className="fixed inset-0 z-30 flex flex-col bg-surface"
    >
      <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-2">
        <h2 id="drawer-title" className="text-lg font-semibold">
          Filtres
        </h2>
        <button ref={closeRef} type="button" onClick={onClose} className={buttonClass}>
          Fermer
        </button>
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        <FilterPanel />
      </div>
      <div className="flex gap-2 border-t border-line px-4 py-2">
        <button type="button" onClick={onReset} disabled={!canReset} className={buttonClass}>
          Réinitialiser
        </button>
        <button type="button" onClick={onClose} className={`${primaryButtonClass} flex-1`}>
          Voir {plural(resultCount, 'prénom')}
        </button>
      </div>
    </div>
  );
}
