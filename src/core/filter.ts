import type { ComponentType } from 'react';
import type { NameEntry } from './types';

/** Propriétés du contrôle d'interface d'un filtre. */
export interface FilterControlProps<P> {
  value: P;
  onChange(params: P): void;
}

/** Filtre : src/filters/<id>.tsx */
export interface Filter<P> {
  id: string;
  label: string;
  /** Groupe d'affichage dans le panneau de filtres (Texte, Popularité…). */
  group: string;
  /** Ids des sources nécessaires ; l'interface masque le filtre si elles manquent. */
  requires?: string[];
  defaultParams: P;
  /** Faux quand les paramètres ne filtrent rien : le filtre est alors ignoré. */
  isActive(params: P): boolean;
  test(entry: NameEntry, params: P): boolean;
  Control: ComponentType<FilterControlProps<P>>;
  toUrl(params: P): string;
  /** Ne lève jamais : une valeur invalide donne defaultParams. */
  fromUrl(value: string): P;
}

/** Filtre dont le type de paramètres n'est pas connu (contenu du registre). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFilter = Filter<any>;
