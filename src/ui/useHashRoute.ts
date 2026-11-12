import { useSyncExternalStore } from 'react';

/** Extrait le chemin du hash : "#/dev?x=1" donne "/dev". */
export function parseHashPath(hash: string): string {
  const path = hash.replace(/^#/, '').split('?')[0] ?? '';
  return path.startsWith('/') ? path : '/';
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/** Routage par hash : GitHub Pages ne réécrit pas les URL. */
export function useHashRoute(): string {
  return useSyncExternalStore(subscribe, () => parseHashPath(window.location.hash));
}
