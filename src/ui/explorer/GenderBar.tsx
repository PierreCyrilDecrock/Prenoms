import { formatPercent } from '@/ui/format';

/** Libellé de la répartition : jamais la couleur seule. */
export function genderLabel(femaleShare: number): string {
  if (femaleShare >= 0.995) return 'Filles';
  if (femaleShare <= 0.005) return 'Garçons';
  return `${formatPercent(femaleShare)} filles · ${formatPercent(1 - femaleShare)} garçons`;
}

/** Libellé court pour les lignes de la liste : le sexe majoritaire et sa part. */
export function genderShortLabel(femaleShare: number): string {
  if (femaleShare >= 0.995) return 'Filles';
  if (femaleShare <= 0.005) return 'Garçons';
  return femaleShare >= 0.5
    ? `${formatPercent(femaleShare)} filles`
    : `${formatPercent(1 - femaleShare)} garçons`;
}

interface Props {
  femaleShare: number;
  /** Version large de la fiche : barre pleine largeur et libellé complet. */
  wide?: boolean;
  /** La barre grandit depuis la gauche à l'apparition. */
  animateIn?: boolean;
}

/** Barre bicolore filles/garçons, accompagnée de son libellé. */
export function GenderBar({ femaleShare, wide, animateIn }: Props) {
  return (
    <span className={`flex min-w-0 gap-2 ${wide ? 'flex-col' : 'items-center'}`}>
      <span
        aria-hidden="true"
        className={`relative block h-2 shrink-0 overflow-hidden rounded-full bg-male ${wide ? 'h-3 w-full' : 'w-12'}`}
      >
        <span
          className={`absolute inset-y-0 left-0 w-full origin-left bg-female transition-transform duration-slow ease-soft ${
            animateIn ? 'animate-grow-x' : ''
          }`}
          style={{ transform: `scaleX(${femaleShare})` }}
        />
      </span>
      <span className={`truncate text-ink-muted ${wide ? 'text-base' : 'text-xs'}`}>
        {wide ? genderLabel(femaleShare) : genderShortLabel(femaleShare)}
      </span>
    </span>
  );
}
