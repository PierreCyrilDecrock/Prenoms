/** Registre en lecture seule de modules identifiés par leur id. */
export interface Registry<T extends { id: string }> {
  /** Nom du type de module, pour les messages (ex. « filtre »). */
  readonly kind: string;
  /** Tous les modules, dans l'ordre de découverte (ordre alphabétique des chemins). */
  all(): readonly T[];
  get(id: string): T | undefined;
  has(id: string): boolean;
}

/** Erreur levée quand un module découvert ne respecte pas le contrat du registre. */
export class RegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegistryError';
  }
}

/**
 * Construit un registre depuis le résultat d'un `import.meta.glob(..., { eager: true })`.
 * Chaque fichier doit exposer son module en `export default`, avec un `id` unique.
 */
export function createRegistry<T extends { id: string }>(
  kind: string,
  modules: Record<string, unknown>,
): Registry<T> {
  const items: T[] = [];
  const pathById = new Map<string, string>();
  const byId = new Map<string, T>();

  for (const path of Object.keys(modules).sort()) {
    const exported = (modules[path] as { default?: unknown } | null | undefined)?.default;
    if (typeof exported !== 'object' || exported === null) {
      throw new RegistryError(
        `Module ${kind} invalide dans « ${path} » : le fichier doit exposer un objet en export default.`,
      );
    }
    const id = (exported as { id?: unknown }).id;
    if (typeof id !== 'string' || id.trim() === '') {
      throw new RegistryError(
        `Module ${kind} invalide dans « ${path} » : la propriété id est manquante ou vide.`,
      );
    }
    const previous = pathById.get(id);
    if (previous !== undefined) {
      throw new RegistryError(
        `Id ${kind} en double : « ${id} » est déclaré dans « ${previous} » et dans « ${path} ».`,
      );
    }
    pathById.set(id, path);
    byId.set(id, exported as T);
    items.push(exported as T);
  }

  return {
    kind,
    all: () => items,
    get: (id) => byId.get(id),
    has: (id) => byId.has(id),
  };
}
