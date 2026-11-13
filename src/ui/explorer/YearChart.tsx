import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { formatInt } from '@/ui/format';

interface Props {
  /** Année de la première valeur des séries. */
  startYear: number;
  female: readonly number[];
  male: readonly number[];
  /** Description lue par les lecteurs d'écran. */
  label: string;
}

const HEIGHT = 260;
const PAD = { top: 12, right: 12, bottom: 28, left: 52 };

/** Arrondit vers le haut à une valeur « ronde » (1, 2 ou 5 × 10ⁿ). */
export function niceMax(value: number): number {
  if (value <= 5) return 5;
  const power = 10 ** Math.floor(Math.log10(value));
  const scaled = value / power;
  return (scaled <= 1 ? 1 : scaled <= 2 ? 2 : scaled <= 5 ? 5 : 10) * power;
}

/** Grande courbe annuelle par sexe. Les deux séries se distinguent par la couleur ET le tracé. */
export function YearChart({ startYear, female, male, label }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(328);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () => setWidth(Math.max(280, element.clientWidth || 328));
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const count = Math.max(female.length, male.length);
  const endYear = startYear + count - 1;
  const max = niceMax(Math.max(...female, ...male, 1));
  const innerWidth = width - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) => PAD.left + (count > 1 ? (index / (count - 1)) * innerWidth : 0);
  const y = (value: number) => PAD.top + innerHeight - (value / max) * innerHeight;
  const path = (values: readonly number[]) =>
    values
      .map(
        (value, index) => `${index === 0 ? 'M' : 'L'}${x(index).toFixed(1)} ${y(value).toFixed(1)}`,
      )
      .join('');

  const yearStep = width < 480 ? 40 : 20;
  const yearTicks: number[] = [];
  for (let year = Math.ceil(startYear / yearStep) * yearStep; year <= endYear; year += yearStep) {
    yearTicks.push(year);
  }
  const valueTicks = [0, max / 2, max];
  const hasFemale = female.some((value) => value > 0);
  const hasMale = male.some((value) => value > 0);

  return (
    <figure className="flex flex-col gap-2">
      {/* La courbe se trace de gauche à droite à l'ouverture de la fiche. */}
      <div
        ref={containerRef}
        className="reveal"
        style={{ '--reveal-duration': 'var(--duration-page)' } as CSSProperties}
      >
        <div>
          <svg role="img" aria-label={label} width={width} height={HEIGHT} className="block">
            {valueTicks.map((tick) => (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  x2={width - PAD.right}
                  y1={y(tick)}
                  y2={y(tick)}
                  stroke="var(--line)"
                />
                <text
                  x={PAD.left - 8}
                  y={y(tick)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize="12"
                  fill="var(--ink-muted)"
                >
                  {formatInt(tick)}
                </text>
              </g>
            ))}
            {yearTicks.map((year) => (
              <text
                key={year}
                x={x(year - startYear)}
                y={HEIGHT - 8}
                textAnchor="middle"
                fontSize="12"
                fill="var(--ink-muted)"
              >
                {year}
              </text>
            ))}
            {hasMale && (
              <path
                d={path(male)}
                fill="none"
                stroke="var(--male)"
                strokeWidth="2"
                strokeDasharray="6 4"
                strokeLinejoin="round"
              />
            )}
            {hasFemale && (
              <path
                d={path(female)}
                fill="none"
                stroke="var(--female)"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            )}
          </svg>
        </div>
      </div>
      <figcaption className="flex flex-wrap gap-4 text-sm text-ink-muted">
        <span className="inline-flex items-center gap-2">
          <svg aria-hidden="true" width="28" height="8">
            <line x1="0" x2="28" y1="4" y2="4" stroke="var(--female)" strokeWidth="2" />
          </svg>
          Filles (trait plein)
        </span>
        <span className="inline-flex items-center gap-2">
          <svg aria-hidden="true" width="28" height="8">
            <line
              x1="0"
              x2="28"
              y1="4"
              y2="4"
              stroke="var(--male)"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
          </svg>
          Garçons (pointillés)
        </span>
      </figcaption>
    </figure>
  );
}
