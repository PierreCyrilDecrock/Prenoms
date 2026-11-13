import { createRegistry } from '@/core/registry';
import type * as Registries from '@/core/registries';

/**
 * Registres réels, limités à certaines sources. Les tests de l'interface travaillent sur les
 * données d'essai de l'INSEE : une source ajoutée plus tard ne doit pas changer ce qu'ils voient.
 *
 * Usage, en tête d'un fichier de test :
 *   vi.mock('@/core/registries', async (importOriginal) => {
 *     const { onlySources } = await import('@/testing/registries');
 *     return onlySources(await importOriginal(), ['insee']);
 *   });
 */
export function onlySources(real: typeof Registries, ids: readonly string[]): typeof Registries {
  const modules = Object.fromEntries(ids.map((id) => [id, { default: real.sources.get(id) }]));
  return { ...real, sources: createRegistry('source', modules) };
}

/** Modules dont toutes les sources requises sont enregistrées (ceux que l'interface affiche). */
export function availableWith<T extends { requires?: string[] }>(
  items: readonly T[],
  sources: { has(id: string): boolean },
): T[] {
  return items.filter((item) => (item.requires ?? []).every((id) => sources.has(id)));
}
