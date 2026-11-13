import { create } from 'zustand';

const STORAGE_KEY = 'prenoms:settings';

interface Stored {
  reduceMotion: boolean;
  haptics: boolean;
}

export interface SettingsState extends Stored {
  setReduceMotion(value: boolean): void;
  setHaptics(value: boolean): void;
}

const defaults: Stored = { reduceMotion: false, haptics: true };

function read(): Stored {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Stored>;
    return {
      reduceMotion: stored.reduceMotion === true,
      haptics: stored.haptics !== false,
    };
  } catch {
    return defaults;
  }
}

function write(value: Stored): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Stockage indisponible (navigation privée) : le réglage vaut pour la session.
  }
}

/** Réglages d'interface de l'utilisateur, conservés sur l'appareil. */
export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...read(),
  setReduceMotion(reduceMotion) {
    set({ reduceMotion });
    write({ reduceMotion, haptics: get().haptics });
  },
  setHaptics(haptics) {
    set({ haptics });
    write({ reduceMotion: get().reduceMotion, haptics });
  },
}));

const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';

/** Vrai si le système demande moins d'animations. */
export function systemPrefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_QUERY).matches;
}

/** Vrai si les animations doivent être réduites à de simples fondus (réglage ou système). */
export function shouldReduceMotion(): boolean {
  return useSettingsStore.getState().reduceMotion || systemPrefersReducedMotion();
}

/** Vibration très courte pour les actions principales, si l'appareil et le réglage le permettent. */
export function haptic(): void {
  if (!useSettingsStore.getState().haptics) return;
  try {
    navigator.vibrate?.(10);
  } catch {
    // Vibration refusée par le navigateur : sans importance.
  }
}
