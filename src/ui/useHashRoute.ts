import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { shouldReduceMotion } from '@/state/settingsStore';

/** Extrait le chemin du hash : "#/dev?x=1" donne "/dev". */
export function parseHashPath(hash: string): string {
  const path = hash.replace(/^#/, '').split('?')[0] ?? '';
  return path.startsWith('/') ? path : '/';
}

type TransitionDocument = Document & {
  startViewTransition?: (update: () => void) => unknown;
};

/** Vrai si le navigateur sait animer un changement de page (API View Transitions). */
export function supportsViewTransitions(): boolean {
  return typeof (document as TransitionDocument).startViewTransition === 'function';
}

function subscribe(onChange: () => void): () => void {
  const onHashChange = () => {
    const doc = document as TransitionDocument;
    if (doc.startViewTransition && !shouldReduceMotion()) {
      // Transition fluide entre deux pages : le rendu se fait dans la transition.
      doc.startViewTransition(() => flushSync(onChange));
    } else {
      onChange();
    }
  };
  window.addEventListener('hashchange', onHashChange);
  return () => window.removeEventListener('hashchange', onHashChange);
}

/** Routage par hash : GitHub Pages ne réécrit pas les URL. */
export function useHashRoute(): string {
  return useSyncExternalStore(subscribe, () => parseHashPath(window.location.hash));
}
