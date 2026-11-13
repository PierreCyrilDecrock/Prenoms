import { useSyncExternalStore } from 'react';

/** Suit une media query ; faux quand matchMedia n'existe pas (tests). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== 'function') return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
  );
}

/** Largeur à partir de laquelle les filtres passent en barre latérale. */
export const DESKTOP_QUERY = '(min-width: 1024px)';
