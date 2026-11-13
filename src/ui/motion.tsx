import { animate, motion, MotionConfig } from 'motion/react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useSettingsStore } from '@/state/settingsStore';
import { formatInt } from '@/ui/format';
import { durations, easings } from '@/ui/tokens';
import { supportsViewTransitions } from '@/ui/useHashRoute';
import { useMediaQuery } from '@/ui/useMediaQuery';

/** Vrai si les animations doivent se réduire à de simples fondus (réglage ou système). */
export function useReducedMotion(): boolean {
  const setting = useSettingsStore((state) => state.reduceMotion);
  const system = useMediaQuery('(prefers-reduced-motion: reduce)');
  return setting || system;
}

/**
 * Applique le réglage d'animation à toute l'application : Motion ne garde que les fondus,
 * et l'attribut data-reduce-motion coupe les mouvements CSS (voir index.css).
 */
export function MotionRoot({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();
  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduce);
  }, [reduce]);
  return <MotionConfig reducedMotion={reduce ? 'always' : 'never'}>{children}</MotionConfig>;
}

/** Nombre entier qui s'anime d'une valeur à l'autre (décoratif : doublé par un texte exact). */
export function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const previous = useRef(value);
  const reduce = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    const from = previous.current;
    previous.current = value;
    if (!node) return;
    if (reduce || from === value) {
      node.textContent = formatInt(value);
      return;
    }
    const controls = animate(from, value, {
      duration: durations.slow,
      ease: easings.soft,
      onUpdate: (current) => {
        node.textContent = formatInt(Math.round(current));
      },
    });
    return () => controls.stop();
  }, [value, reduce]);

  return <span ref={ref}>{formatInt(value)}</span>;
}

/**
 * Apparition d'une page. Quand le navigateur gère les View Transitions, elles s'en chargent ;
 * sinon, Motion fait entrer la page en fondu avec un léger glissement.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  if (supportsViewTransitions()) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: durations.slow, ease: easings.soft }}
    >
      {children}
    </motion.div>
  );
}
