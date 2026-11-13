import { create } from 'zustand';

export interface Toast {
  id: number;
  text: string;
}

export interface ToastState {
  toasts: Toast[];
  /** Affiche une notification discrète, retirée après quelques secondes. */
  show(text: string): void;
  dismiss(id: number): void;
}

export const TOAST_DURATION_MS = 2500;
let nextId = 1;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  show(text) {
    const id = nextId++;
    set((state) => ({ toasts: [...state.toasts.slice(-2), { id, text }] }));
    setTimeout(() => get().dismiss(id), TOAST_DURATION_MS);
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));
