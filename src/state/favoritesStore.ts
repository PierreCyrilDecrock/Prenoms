import { create } from 'zustand';

export interface FavoritesState {
  /** Ids des prénoms favoris. */
  ids: Record<string, true>;
  toggle(id: string): void;
}

/** Favoris de la session (la conservation sur l'appareil arrive à l'étape 10). */
export const useFavoritesStore = create<FavoritesState>()((set) => ({
  ids: {},
  toggle: (id) =>
    set((state) => {
      const ids = { ...state.ids };
      if (ids[id]) delete ids[id];
      else ids[id] = true;
      return { ids };
    }),
}));
