import { create } from 'zustand';

/** Dernier prénom ouvert : son titre est l'élément partagé de la transition liste ↔ fiche. */
export const useNavStore = create<{
  lastOpenedId: string | null;
  setLastOpened(id: string): void;
}>()((set) => ({
  lastOpenedId: null,
  setLastOpened: (lastOpenedId) => set({ lastOpenedId }),
}));

/** Nom de transition partagé par la ligne ouverte et le titre de la fiche. */
export const NAME_TRANSITION = 'name-title';
