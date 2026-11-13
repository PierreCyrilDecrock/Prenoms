import { del, get, set } from 'idb-keyval';
import type { DataSource } from '@/core';
import { runInSlices } from '@/core/slices';
import { INSEE_SOURCE_ID, toRecordsSteps } from './facts';
import { INSEE_FORMAT_VERSION, type InseeData, type InseeMeta, type InseeReport } from './format';

export const CACHE_KEY = 'insee:data';

const baseUrl = () => `${import.meta.env.BASE_URL}data/`;

/**
 * Entrée du cache : le JSON est gardé sous forme de texte. Copier un texte dans IndexedDB est
 * quasi instantané, alors que copier l'objet lu (des dizaines de milliers de tableaux)
 * bloquerait l'interface.
 */
interface CacheEntry {
  meta: InseeMeta;
  text: string;
}

/** Lit le cache IndexedDB ; indisponible (navigation privée, tests) = pas de cache. */
async function readCache(): Promise<CacheEntry | undefined> {
  try {
    const cached = await get<CacheEntry>(CACHE_KEY);
    return cached?.meta?.formatVersion === INSEE_FORMAT_VERSION && typeof cached.text === 'string'
      ? cached
      : undefined;
  } catch {
    return undefined;
  }
}

async function writeCache(entry: CacheEntry): Promise<void> {
  try {
    await set(CACHE_KEY, entry);
  } catch {
    // Le cache est un confort : son échec ne doit pas empêcher l'affichage.
  }
}

/** Petit rapport publié à côté des données : il porte le bloc meta et la taille du fichier. */
async function fetchReport(): Promise<InseeReport | undefined> {
  try {
    const response = await fetch(`${baseUrl()}insee.report.json`, { cache: 'no-cache' });
    return response.ok ? ((await response.json()) as InseeReport) : undefined;
  } catch {
    return undefined;
  }
}

/** Télécharge le JSON en signalant la progression (0 à 1) quand la taille totale est connue. */
async function fetchText(
  url: string,
  totalBytes: number | undefined,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Téléchargement des prénoms INSEE impossible (HTTP ${response.status}).`);
  }
  if (!response.body || !totalBytes) {
    return response.text();
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    text += decoder.decode(value, { stream: true });
    onProgress?.(Math.min(received / totalBytes, 0.99));
  }
  text += decoder.decode();
  return text;
}

const sameVersion = (a: InseeMeta, b: InseeMeta) =>
  a.formatVersion === b.formatVersion && a.generatedAt === b.generatedAt;

/** Source INSEE : fichier national des prénoms, pré-agrégé dans public/data/insee.json. */
const insee: DataSource = {
  id: INSEE_SOURCE_ID,
  label: 'INSEE – Fichier des prénoms',

  async load(onProgress) {
    onProgress?.(0);
    const [cached, report] = await Promise.all([readCache(), fetchReport()]);
    const remote = report?.meta;

    // Cache valide : même version de format et même date de génération que le fichier publié.
    // Sans réseau (rapport injoignable), le cache est utilisé tel quel.
    const usable = cached && (!remote || sameVersion(cached.meta, remote)) ? cached : undefined;
    const fromCache = usable !== undefined;

    let text = usable?.text;
    if (text === undefined) {
      const version = remote ? `?v=${encodeURIComponent(remote.generatedAt)}` : '';
      text = await fetchText(`${baseUrl()}insee.json${version}`, report?.size?.raw, onProgress);
    }
    // Laisse le navigateur afficher la progression avant l'analyse du JSON, qui est indivisible.
    await new Promise((resolve) => setTimeout(resolve));
    const data = JSON.parse(text) as InseeData;
    if (data.meta?.formatVersion !== INSEE_FORMAT_VERSION) {
      throw new Error(
        `Format des données INSEE inattendu (version ${data.meta?.formatVersion}, ` +
          `attendue ${INSEE_FORMAT_VERSION}).`,
      );
    }
    if (!fromCache) await writeCache({ meta: data.meta, text });

    // Calcul des faits par tranches courtes : l'interface reste réactive pendant le chargement.
    const records = await runInSlices(toRecordsSteps(data));
    onProgress?.(1);
    return { records, meta: { ...data.meta, fromCache } };
  },

  async clearCache() {
    await del(CACHE_KEY);
  },
};

export default insee;
