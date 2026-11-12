import { useEffect, useState } from 'react';
import type { InseeReport } from '@/sources/insee/format';

const reportUrl = `${import.meta.env.BASE_URL}data/insee.report.json`;
const dataUrl = `${import.meta.env.BASE_URL}data/insee.json`;

const int = (value: number) => value.toLocaleString('fr-FR');
const megabytes = (bytes: number) =>
  `${(bytes / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} Mo`;

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; report: InseeReport };

/** Section « Étape 3 » de la page de diagnostic : statistiques des données INSEE générées. */
export function DevStep3() {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    fetch(reportUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<InseeReport>;
      })
      .then((report) => !cancelled && setState({ status: 'ready', report }))
      .catch(
        (error: unknown) => !cancelled && setState({ status: 'error', message: String(error) }),
      );
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') return <p className="text-ink-muted">Chargement du rapport…</p>;
  if (state.status === 'error') {
    return (
      <p role="alert" className="text-danger">
        Rapport introuvable ({reportUrl}) : {state.message}
      </p>
    );
  }

  const { meta, csv, excluded, mergedVariants, size } = state.report;
  const excludedRows = excluded.unknownYear.rows + excluded.rareNames.rows + excluded.invalid.rows;
  const rows: [string, string][] = [
    ['Prénoms', int(meta.nameCount)],
    ['Plage d’années', `${meta.yearMin}–${meta.yearMax}`],
    ['Naissances conservées', int(meta.totalBirths)],
    ['Taille brute', size ? megabytes(size.raw) : 'inconnue'],
    ['Taille gzip', size ? megabytes(size.gzip) : 'inconnue'],
    ['Lignes exclues', `${int(excludedRows)} sur ${int(csv.rows)}`],
    [
      '· année inconnue (XXXX)',
      `${int(excluded.unknownYear.rows)} lignes, ${int(excluded.unknownYear.births)} naissances`,
    ],
    [
      '· prénoms rares regroupés',
      `${int(excluded.rareNames.rows)} lignes, ${int(excluded.rareNames.births)} naissances`,
    ],
    ['· lignes illisibles', int(excluded.invalid.rows)],
    ['Prénoms sans année connue', `${int(excluded.namesWithoutKnownYear)} (écartés)`],
    ['Graphies fusionnées', `${int(mergedVariants)} (ex. Lea et Léa)`],
    ['Fichier source', meta.sourceFile],
    ['Généré le', new Date(meta.generatedAt).toLocaleString('fr-FR')],
    ['Version du format', String(meta.formatVersion)],
  ];

  return (
    <div className="flex flex-col gap-4" data-testid="insee-report">
      <dl>
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex flex-col border-b border-line py-2 last:border-b-0 sm:flex-row sm:gap-4"
          >
            <dt className="shrink-0 text-ink-muted sm:w-56">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      <p>
        <a href={dataUrl} className="inline-flex min-h-11 items-center text-accent underline">
          Ouvrir data/insee.json
        </a>
      </p>
    </div>
  );
}
