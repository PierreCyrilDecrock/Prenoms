import { del, get, set } from 'idb-keyval';
import type { DataSource } from '@/core';
import { INSEE_SOURCE_ID, toRecords } from './facts';
import { INSEE_FORMAT_VERSION, type InseeData, type InseeMeta, type InseeReport } from './format';

export const CACHE_KEY = 'insee:data';

const baseUrl = () => `${import.meta.env.BASE_URL}data/`;

/** Lit le cache IndexedDB ; indisponible (navigation privée, tests) = pas de cache. */
async function readCache(): Promise<InseeData | undefined> {
  try {
    const cached = await get<InseeData>(CACHE_KEY);
    return cached?.meta?.formatVersion === INSEE_FORMAT_VERSION ? cached : undefined;
  } catch {
    return undefined;
  }
}

async function writeCache(data: InseeData): Promise<void> {
  try {
    await set(CACHE_KEY, data);
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
async function fetchData(
  url: string,
  totalBytes: number | undefined,
  onProgress?: (progress: number) => void,
): Promise<InseeData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Téléchargement des prénoms INSEE impossible (HTTP ${response.status}).`);
  }
  if (!response.body || !totalBytes) {
    return (await response.json()) as InseeData;
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
  return JSON.parse(text) as InseeData;
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
    let data = cached && (!remote || sameVersion(cached.meta, remote)) ? cached : undefined;
    const fromCache = data !== undefined;

    if (!data) {
      const version = remote ? `?v=${encodeURIComponent(remote.generatedAt)}` : '';
      data = await fetchData(`${baseUrl()}insee.json${version}`, report?.size?.raw, onProgress);
      if (data.meta?.formatVersion !== INSEE_FORMAT_VERSION) {
        throw new Error(
          `Format des données INSEE inattendu (version ${data.meta?.formatVersion}, ` +
            `attendue ${INSEE_FORMAT_VERSION}).`,
        );
      }
      await writeCache(data);
    }

    const records = toRecords(data);
    onProgress?.(1);
    return { records, meta: { ...data.meta, fromCache } };
  },

  async clearCache() {
    await del(CACHE_KEY);
  },
};

export default insee;
