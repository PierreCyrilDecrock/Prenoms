import { animate, motion, useMotionValue } from 'motion/react';
import { useEffect, useRef, type PointerEvent } from 'react';
import { plural } from '@/ui/format';
import { durations } from '@/ui/tokens';
import { FilterPanel } from './FilterPanel';
import { buttonClass, primaryButtonClass } from './States';

interface Props {
  resultCount: number;
  canReset: boolean;
  onReset(): void;
  onClose(): void;
}

/** Distance (px) ou vitesse (px/s) de glissement vers le bas au-delà de laquelle le tiroir se ferme. */
const CLOSE_DISTANCE = 120;
const CLOSE_VELOCITY = 600;

/** Tiroir de filtres plein écran (mobile) : ressort doux, fermeture en le faisant glisser. */
export function FilterDrawer({ resultCount, canReset, onReset, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  // Glissement du tiroir : il suit le doigt vers le bas, puis se ferme ou revient en place.
  // Positions en pixels : le glissement lit et écrit cette même valeur.
  const offscreen = window.innerHeight;
  const y = useMotionValue(offscreen);
  const dragStart = useRef<number | null>(null);

  const onDragStart = (event: PointerEvent<HTMLDivElement>) => {
    dragStart.current = event.clientY - (Number(y.get()) || 0);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const onDragMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStart.current === null) return;
    y.set(Math.max(0, event.clientY - dragStart.current));
  };
  const onDragEnd = () => {
    if (dragStart.current === null) return;
    dragStart.current = null;
    if (y.get() > CLOSE_DISTANCE || y.getVelocity() > CLOSE_VELOCITY) onClose();
    else animate(y, 0, { type: 'spring', visualDuration: durations.base, bounce: 0.12 });
  };

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
    <>
      <motion.div
        aria-hidden="true"
        className="fixed inset-0 z-30 bg-surface-sunken"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        exit={{ opacity: 0 }}
        transition={{ duration: durations.base }}
      />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="fixed inset-0 z-30 flex flex-col bg-surface"
        initial={{ y: offscreen, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: offscreen, opacity: 0 }}
        transition={{
          y: { type: 'spring', visualDuration: durations.slow, bounce: 0.12 },
          opacity: { duration: durations.fast },
        }}
        style={{ y }}
      >
        {/* Seul l'en-tête sert de poignée : le contenu, lui, défile normalement. */}
        <div
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
          className="flex touch-none flex-col border-b border-line px-4 pt-2 pb-2"
        >
          <span aria-hidden="true" className="mx-auto mb-1 h-1 w-10 rounded-full bg-line" />
          <div className="flex items-center justify-between gap-2">
            <h2 id="drawer-title" className="text-lg font-semibold">
              Filtres
            </h2>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              onPointerDown={(event) => event.stopPropagation()}
              className={buttonClass}
            >
              Fermer
            </button>
          </div>
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
      </motion.div>
    </>
  );
}
