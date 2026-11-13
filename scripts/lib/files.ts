import { readdirSync } from 'node:fs';
import { join } from 'node:path';

export const RAW_DIR = 'data/raw';
export const OUT_JSON = 'public/data/insee.json';
export const OUT_REPORT = 'public/data/insee.report.json';

/** Chemin du CSV national de l'INSEE : argument de la ligne de commande, sinon l'unique *nat*.csv de data/raw. */
export function findInseeCsv(argument?: string): string {
  if (argument) return argument;
  const candidates = readdirSync(RAW_DIR).filter((file) => /nat.*\.csv$/i.test(file));
  if (candidates.length === 0) {
    throw new Error(
      `Aucun fichier *nat*.csv dans ${RAW_DIR}/. Téléchargez le fichier national sur ` +
        'https://www.insee.fr/fr/statistiques/8595130 et décompressez-le dans ce dossier.',
    );
  }
  if (candidates.length > 1) {
    throw new Error(
      `Plusieurs fichiers candidats dans ${RAW_DIR}/ (${candidates.join(', ')}) : ` +
        'passez le chemin voulu en argument.',
    );
  }
  return join(RAW_DIR, candidates[0]!);
}

export const formatInt = (value: number) => value.toLocaleString('fr-FR');
export const formatBytes = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(2)} Mo`
    : `${(bytes / 1024).toFixed(1)} Ko`;
