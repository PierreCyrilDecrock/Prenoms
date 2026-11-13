import { AnimatePresence, motion } from 'motion/react';
import { useToastStore } from '@/state/toastStore';
import { durations, easings } from '@/ui/tokens';

/** Notifications discrètes en bas de l'écran. */
export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.p
            key={toast.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: durations.base, ease: easings.soft }}
            className="rounded-card bg-ink px-4 py-3 text-sm font-medium text-surface"
          >
            {toast.text}
          </motion.p>
        ))}
      </AnimatePresence>
    </div>
  );
}
