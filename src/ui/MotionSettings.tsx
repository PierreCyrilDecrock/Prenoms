import { haptic, useSettingsStore } from '@/state/settingsStore';

const rowClass = 'inline-flex min-h-11 cursor-pointer items-center gap-2';

/** Réglages « Réduire les animations » et « Retour tactile ». */
export function MotionSettings() {
  const reduceMotion = useSettingsStore((state) => state.reduceMotion);
  const haptics = useSettingsStore((state) => state.haptics);
  const setReduceMotion = useSettingsStore((state) => state.setReduceMotion);
  const setHaptics = useSettingsStore((state) => state.setHaptics);

  return (
    <fieldset className="flex flex-wrap justify-center gap-x-6">
      <legend className="sr-only">Réglages d’affichage</legend>
      <label className={rowClass}>
        <input
          type="checkbox"
          checked={reduceMotion}
          onChange={(event) => setReduceMotion(event.target.checked)}
          className="size-5 accent-accent"
        />
        Réduire les animations
      </label>
      <label className={rowClass}>
        <input
          type="checkbox"
          checked={haptics}
          onChange={(event) => {
            setHaptics(event.target.checked);
            if (event.target.checked) haptic();
          }}
          className="size-5 accent-accent"
        />
        Retour tactile (vibration)
      </label>
    </fieldset>
  );
}
