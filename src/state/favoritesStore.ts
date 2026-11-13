import { create } from 'zustand';

export const FAVORITES_KEY = 'prenoms:favorites';

export interface FavoritesState {
  /** Ids des prénoms favoris. */
  ids: Record<string, true>;
  toggle(id: string): void;
  clear(): void;
}

function read(): Record<string, true> {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
    if (!Array.isArray(stored)) return {};
    return Object.fromEntries(
      stored.filter((id): id is string => typeof id === 'string').map((id) => [id, true as const]),
    );
  } catch {
    return {};
  }
}

function write(ids: Record<string, true>): void {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Object.keys(ids)));
  } catch {
    // Stockage indisponible (navigation privée) : les favoris valent pour la session.
  }
}

/** Favoris, conservés sur l'appareil (localStorage). */
export const useFavoritesStore = create<FavoritesState>()((set) => ({
  ids: read(),
  toggle: (id) =>
    set((state) => {
      const ids = { ...state.ids };
      if (ids[id]) delete ids[id];
      else ids[id] = true;
      write(ids);
      return { ids };
    }),
  clear: () => {
    write({});
    set({ ids: {} });
  },
}));
