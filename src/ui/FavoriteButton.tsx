import { motion } from 'motion/react';
import { useFavoritesStore } from '@/state/favoritesStore';
import { haptic } from '@/state/settingsStore';
import { durations, easings } from '@/ui/tokens';

/** Cœur des favoris, avec une courte animation au clic. */
export function FavoriteButton({ id, label }: { id: string; label: string }) {
  const active = useFavoritesStore((state) => state.ids[id] === true);
  const toggle = useFavoritesStore((state) => state.toggle);

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Retirer ${label} des favoris` : `Ajouter ${label} aux favoris`}
      onClick={() => {
        toggle(id);
        haptic();
      }}
      className={`pressable inline-flex size-11 shrink-0 items-center justify-center rounded-full ${
        active ? 'text-danger' : 'text-ink-muted'
      }`}
    >
      <motion.svg
        key={String(active)}
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="size-6"
        initial={active ? { scale: 0.6 } : false}
        animate={{ scale: active ? [0.6, 1.25, 1] : 1 }}
        transition={{ duration: durations.slow, ease: easings.soft }}
      >
        <path
          d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"
          fill={active ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </motion.svg>
    </button>
  );
}
