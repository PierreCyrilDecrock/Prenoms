import { memo } from 'react';

const WIDTH = 96;
const HEIGHT = 28;

/** Chemin SVG d'une série, mise à l'échelle sur sa propre valeur maximale. */
export function sparklinePath(values: readonly number[], width = WIDTH, height = HEIGHT): string {
  const max = Math.max(...values, 1);
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  return values
    .map((value, index) => {
      const x = (index * step).toFixed(1);
      const y = (height - 1 - (value / max) * (height - 2)).toFixed(1);
      return `${index === 0 ? 'M' : 'L'}${x} ${y}`;
    })
    .join('');
}

/** Mini-courbe d'évolution annuelle (décorative : le total est donné en texte à côté). */
export const Sparkline = memo(function Sparkline({ values }: { values: readonly number[] }) {
  return (
    <svg
      aria-hidden="true"
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      preserveAspectRatio="none"
      className="h-7 w-18 shrink-0 text-accent sm:w-28"
    >
      <path
        d={sparklinePath(values)}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
});
