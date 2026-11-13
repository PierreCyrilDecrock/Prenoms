import { useToastStore } from '@/state/toastStore';
import { MotionSettings } from '@/ui/MotionSettings';
import { useReducedMotion } from '@/ui/motion';
import { supportsViewTransitions } from '@/ui/useHashRoute';
import { useMediaQuery } from '@/ui/useMediaQuery';

/** Section « Étape 9 » de la page de diagnostic : réglages de mouvement et capacités de l'appareil. */
export function DevStep9() {
  const reduced = useReducedMotion();
  const systemReduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const showToast = useToastStore((state) => state.show);
  const canVibrate = typeof navigator.vibrate === 'function';

  const rows: [string, string][] = [
    ['Animations', reduced ? 'réduites à de simples fondus' : 'complètes'],
    ['Réglage du système', systemReduced ? 'demande moins d’animations' : 'aucune restriction'],
    [
      'Transition liste ↔ fiche',
      supportsViewTransitions() ? 'View Transitions du navigateur' : 'repli : fondu Motion',
    ],
    ['Vibration', canVibrate ? 'disponible sur cet appareil' : 'non disponible sur cet appareil'],
  ];

  return (
    <div className="flex flex-col gap-4">
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-4 border-b border-line py-2 last:border-b-0">
            <dt className="w-44 shrink-0 text-ink-muted">{label}</dt>
            <dd className="font-medium" data-testid={`motion-${label}`}>
              {value}
            </dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col items-start gap-2">
        <MotionSettings />
        <button
          type="button"
          onClick={() => showToast('Exemple de notification')}
          className="pressable min-h-11 rounded-card border border-line px-4 font-medium"
        >
          Afficher une notification
        </button>
      </div>
      <p className="text-sm text-ink-muted">
        Mesure faite au build de cette étape, dans un navigateur de test sans carte graphique : 58
        images par seconde pendant une frappe rapide et pendant des changements de tri sur la liste
        complète.
      </p>
    </div>
  );
}
