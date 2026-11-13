import { useLayoutEffect } from 'react';
import { useQueryStore } from './queryStore';
import {
  hashQueryString,
  isDiscreteChange,
  listHref,
  parseQuery,
  serializeQuery,
} from './urlState';

const isListRoute = () => {
  const path = window.location.hash.replace(/^#/, '').split('?')[0] ?? '';
  return path === '' || path === '/';
};

/**
 * Garde l'URL et la requête synchronisées : l'URL est la source de vérité.
 * - À l'ouverture, au retour arrière et à tout changement de hash : l'URL remplit la requête.
 * - À chaque changement de la requête : l'URL est réécrite (replaceState pour une frappe,
 *   pushState pour un changement discret).
 * Ne fait rien hors de la page de liste.
 */
export function useUrlSync(): void {
  useLayoutEffect(() => {
    let applying = false;

    const applyFromUrl = () => {
      if (!isListRoute()) return;
      const fromUrl = parseQuery(hashQueryString());
      if (serializeQuery(fromUrl) === serializeQuery(useQueryStore.getState())) return;
      applying = true;
      useQueryStore.setState(fromUrl);
      applying = false;
    };

    const unsubscribe = useQueryStore.subscribe((state, previous) => {
      if (!isListRoute()) return;
      const serialized = serializeQuery(state);
      if (serialized === hashQueryString()) return;
      // Une requête venue de l'URL ne crée pas d'entrée : elle est seulement remise au propre.
      const push = !applying && isDiscreteChange(previous, state);
      window.history[push ? 'pushState' : 'replaceState'](null, '', listHref(state));
    });

    applyFromUrl();
    window.addEventListener('hashchange', applyFromUrl);
    window.addEventListener('popstate', applyFromUrl);
    return () => {
      unsubscribe();
      window.removeEventListener('hashchange', applyFromUrl);
      window.removeEventListener('popstate', applyFromUrl);
    };
  }, []);
}
