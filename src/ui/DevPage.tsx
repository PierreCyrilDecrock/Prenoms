import type { ReactNode } from 'react';
import { buildInfo } from '@/ui/buildInfo';
import { DevStep2 } from '@/ui/DevStep2';
import { DevStep3 } from '@/ui/DevStep3';
import { DevStep4 } from '@/ui/DevStep4';
import { DevStep5 } from '@/ui/DevStep5';
import { DevStep6 } from '@/ui/DevStep6';
import { DevStep7 } from '@/ui/DevStep7';
import { DevStep8 } from '@/ui/DevStep8';
import { colorTokens } from '@/ui/tokens';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-panel border border-line bg-surface-raised p-4 sm:p-6">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-line py-2 last:border-b-0 sm:flex-row sm:gap-4">
      <dt className="shrink-0 text-ink-muted sm:w-40">{label}</dt>
      <dd className="break-all font-medium">{children}</dd>
    </div>
  );
}

const durationTokens = [
  { name: 'fast', css: '--duration-fast' },
  { name: 'base', css: '--duration-base' },
  { name: 'slow', css: '--duration-slow' },
  { name: 'page', css: '--duration-page' },
];

/**
 * Page de diagnostic, conservée pendant tout le projet.
 * Chaque étape y ajoute une section pour vérifier son résultat en ligne.
 */
export function DevPage() {
  const buildDate = new Date(buildInfo.date);
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-2">
        <a href="#/" className="inline-flex min-h-11 items-center self-start text-accent underline">
          ← Application
        </a>
        <h1 className="text-3xl font-semibold tracking-tight">{buildInfo.projectName}</h1>
        <p className="text-ink-muted">Page de diagnostic</p>
      </header>

      <Section title="Build">
        <dl>
          <Row label="Commit (SHA)">
            <code data-testid="build-sha">{buildInfo.sha}</code>
          </Row>
          <Row label="Date de build">
            <time dateTime={buildInfo.date} data-testid="build-date">
              {buildDate.toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'medium' })}
            </time>{' '}
            <span className="font-normal text-ink-muted">({buildInfo.date})</span>
          </Row>
          <Row label="Chemin de base">
            <code>{import.meta.env.BASE_URL}</code>
          </Row>
        </dl>
      </Section>

      <Section title="Étape 1 – Initialisation et déploiement">
        <div className="flex flex-col gap-6">
          <div>
            <h3 className="mb-2 font-medium">Couleurs (thème clair ou sombre selon l’appareil)</h3>
            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {colorTokens.map((token) => (
                <li
                  key={token.name}
                  className="flex items-center gap-2 rounded-card border border-line p-2"
                >
                  <span
                    aria-hidden="true"
                    className="size-8 shrink-0 rounded-card border border-line"
                    style={{ background: `var(--${token.name})` }}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{token.label}</span>
                    <code className="truncate text-xs text-ink-muted">--{token.name}</code>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 font-medium">Typographie (Inter, auto-hébergée)</h3>
            <p className="text-3xl font-semibold">Léa, Noël, Anaïs, Jean-Baptiste</p>
            <p className="text-ink-muted">Chiffres tabulaires : 1 234 567 · 111 111 · 890 000</p>
          </div>

          <div>
            <h3 className="mb-2 font-medium">Rayons et espacements</h3>
            <div className="flex flex-wrap items-end gap-4">
              <div className="rounded-card bg-accent-soft p-4 text-sm">rayon 12 px</div>
              <div className="rounded-panel bg-accent-soft p-4 text-sm">rayon 16 px</div>
              {[1, 2, 3, 4, 6, 8].map((n) => (
                <div key={n} className="flex flex-col items-center gap-1 text-xs text-ink-muted">
                  <span className="block bg-accent" style={{ width: n * 4, height: n * 4 }} />
                  {n * 4}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-2 font-medium">Durées d’animation (survoler ou appuyer)</h3>
            <ul className="flex flex-col gap-2">
              {durationTokens.map((d) => (
                <li key={d.name} className="group flex items-center gap-4">
                  <code className="w-32 shrink-0 text-xs text-ink-muted">{d.css}</code>
                  <span className="relative block h-6 flex-1 overflow-hidden rounded-card bg-surface-sunken">
                    <span
                      className="absolute inset-y-0 left-0 w-1/4 rounded-card bg-accent ease-soft group-hover:translate-x-[300%] group-active:translate-x-[300%]"
                      style={{
                        transitionProperty: 'transform',
                        transitionDuration: `var(${d.css})`,
                      }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Étape 2 – Contrats du cœur">
        <DevStep2 />
      </Section>

      <Section title="Étape 3 – Pipeline de données INSEE">
        <DevStep3 />
      </Section>

      <Section title="Étape 4 – Source INSEE dans le navigateur">
        <DevStep4 />
      </Section>

      <Section title="Étape 5 – Moteur de requête">
        <DevStep5 />
      </Section>

      <Section title="Étape 6 – Filtres de la v1">
        <DevStep6 />
      </Section>

      <Section title="Étape 7 – Tris de la v1">
        <DevStep7 />
      </Section>

      <Section title="Étape 8 – Interface : structure et lisibilité">
        <DevStep8 />
      </Section>
    </main>
  );
}
