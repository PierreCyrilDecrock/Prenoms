/**
 * Travail découpé en tranches. Un traitement long s'écrit comme un générateur qui rend la main
 * régulièrement (`yield`) ; il peut alors être exécuté d'une traite (tests, scripts) ou par
 * tranches courtes qui laissent le navigateur répondre entre deux.
 */

/** Durée maximale d'une tranche, en millisecondes, avant de rendre la main au navigateur. */
export const SLICE_BUDGET_MS = 8;

/** Exécute le générateur jusqu'au bout, sans pause. */
export function runToEnd<T>(steps: Generator<void, T>): T {
  for (;;) {
    const step = steps.next();
    if (step.done) return step.value;
  }
}

const pause = () => new Promise<void>((resolve) => setTimeout(resolve));

/** Exécute le générateur par tranches d'au plus SLICE_BUDGET_MS, avec une pause entre deux. */
export async function runInSlices<T>(steps: Generator<void, T>): Promise<T> {
  let sliceStart = performance.now();
  for (;;) {
    const step = steps.next();
    if (step.done) return step.value;
    if (performance.now() - sliceStart >= SLICE_BUDGET_MS) {
      await pause();
      sliceStart = performance.now();
    }
  }
}
