import { useEffect, useState } from 'react';

const base = import.meta.env.BASE_URL;

const meta = (selector: string, attribute = 'content') =>
  document.head.querySelector(selector)?.getAttribute(attribute) ?? '';

interface Check {
  label: string;
  ok: boolean | null;
  detail: string;
}

/** Vrai si l'adresse ne renvoie pas le fichier demandé (erreur, ou page HTML de repli). */
async function isAbsent(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    return !response.ok || (response.headers.get('content-type') ?? '').includes('text/html');
  } catch {
    return true;
  }
}

async function isPresent(url: string, type: string): Promise<boolean> {
  try {
    const response = await fetch(url, { cache: 'no-store' });
    return response.ok && (response.headers.get('content-type') ?? '').includes(type);
  } catch {
    return false;
  }
}

/** Section « Étape 12 » de la page de diagnostic : métadonnées de la page et fichiers publiés. */
export function DevStep12() {
  const [checks, setChecks] = useState<Check[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const results: Check[] = [
        {
          label: 'Fichier brut de l’Insee non publié',
          ok: await isAbsent(`${base}data/raw/prenoms-2023-nat.csv`),
          detail: 'data/raw/prenoms-2023-nat.csv',
        },
        {
          label: 'Données publiées',
          ok: await isPresent(`${base}data/insee.report.json`, 'json'),
          detail: 'data/insee.json et son rapport',
        },
        {
          label: 'Manifest',
          ok: await isPresent(`${base}manifest.webmanifest`, 'json'),
          detail: 'manifest.webmanifest',
        },
        {
          label: 'Image d’aperçu de lien',
          ok: await isPresent(`${base}og.png`, 'image/png'),
          detail: 'og.png (1200 × 630)',
        },
      ];
      if (!cancelled) setChecks(results);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows: [string, string][] = [
    ['Titre de la page', document.title],
    ['Description', meta('meta[name="description"]')],
    ['Titre de l’aperçu', meta('meta[property="og:title"]')],
    ['Description de l’aperçu', meta('meta[property="og:description"]')],
    ['Adresse de l’aperçu', meta('meta[property="og:url"]')],
    ['Image de l’aperçu', meta('meta[property="og:image"]')],
    ['Chemin de base', base],
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <img
          src={`${base}favicon.svg`}
          alt="Icône du site"
          width={48}
          height={48}
          className="rounded-card"
        />
        <img
          src={`${base}og.png`}
          alt="Image affichée dans l’aperçu d’un lien partagé"
          width={240}
          height={126}
          className="rounded-card border border-line"
        />
      </div>

      <dl>
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex flex-col border-b border-line py-2 last:border-b-0 sm:flex-row sm:gap-4"
          >
            <dt className="shrink-0 text-ink-muted sm:w-52">{label}</dt>
            <dd className="font-medium break-words" data-testid={`meta-${label}`}>
              {value || <span className="text-danger">absent</span>}
            </dd>
          </div>
        ))}
      </dl>

      <ul className="flex flex-col gap-1" data-testid="publication-checks">
        {checks.length === 0 && (
          <li className="text-ink-muted">Vérification des fichiers publiés…</li>
        )}
        {checks.map((check) => (
          <li key={check.label}>
            <strong className={check.ok ? 'text-success' : 'text-danger'}>
              {check.ok ? 'OK' : 'Échec'}
            </strong>{' '}
            · {check.label} <span className="text-sm text-ink-muted">({check.detail})</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
