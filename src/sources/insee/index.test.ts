import { del, get, set } from 'idb-keyval';
import { sampleData } from './facts.test';
import type { InseeData } from './format';
import insee, { CACHE_KEY } from './index';

vi.mock('idb-keyval', () => {
  const store = new Map<string, unknown>();
  return {
    get: vi.fn(async (key: string) => store.get(key)),
    set: vi.fn(async (key: string, value: unknown) => void store.set(key, value)),
    del: vi.fn(async (key: string) => void store.delete(key)),
  };
});

const json = JSON.stringify(sampleData);
const report = { meta: sampleData.meta, size: { raw: new TextEncoder().encode(json).length } };

/** Réponses du réseau simulé : null = requête en échec. */
function stubFetch(routes: { report?: unknown | null; data?: string | null; dataStatus?: number }) {
  const fetchMock = vi.fn(async (url: string) => {
    if (url.includes('insee.report.json')) {
      if (routes.report == null) throw new TypeError('réseau indisponible');
      return new Response(JSON.stringify(routes.report));
    }
    if (routes.data == null) throw new TypeError('réseau indisponible');
    return new Response(routes.data, { status: routes.dataStatus ?? 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const dataCalls = (fetchMock: ReturnType<typeof stubFetch>) =>
  fetchMock.mock.calls.filter(([url]) => url.includes('insee.json'));

describe('source INSEE', () => {
  beforeEach(async () => {
    await del(CACHE_KEY);
    vi.clearAllMocks();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('respecte le contrat DataSource', () => {
    expect(insee.id).toBe('insee');
    expect(insee.label).toMatch(/INSEE/);
  });

  it('télécharge les données sous BASE_URL, signale la progression et remplit le cache', async () => {
    const fetchMock = stubFetch({ report, data: json });
    const progress: number[] = [];
    const result = await insee.load((value) => progress.push(value));

    expect(result.records).toHaveLength(3);
    expect(result.records[0]?.facts).toMatchObject({ total: 65, peakYear: 1902 });
    expect(result.meta).toMatchObject({ fromCache: false, formatVersion: 1, yearMax: 1905 });
    expect(dataCalls(fetchMock)[0]?.[0]).toBe(
      `${import.meta.env.BASE_URL}data/insee.json?v=${encodeURIComponent(sampleData.meta.generatedAt)}`,
    );
    expect(progress[0]).toBe(0);
    expect(progress.at(-1)).toBe(1);
    expect(progress.length).toBeGreaterThan(2);
    expect([...progress].sort((a, b) => a - b)).toEqual(progress);
    expect(set).toHaveBeenCalledWith(CACHE_KEY, sampleData);
  });

  it('utilise le cache quand la version et la date de génération sont identiques', async () => {
    await set(CACHE_KEY, sampleData);
    const fetchMock = stubFetch({ report, data: json });
    const result = await insee.load();
    expect(result.meta?.fromCache).toBe(true);
    expect(result.records).toHaveLength(3);
    expect(dataCalls(fetchMock)).toHaveLength(0);
  });

  it('invalide le cache quand la date de génération change', async () => {
    const stale: InseeData = { ...sampleData, meta: { ...sampleData.meta, generatedAt: '2020' } };
    await set(CACHE_KEY, stale);
    const fetchMock = stubFetch({ report, data: json });
    const result = await insee.load();
    expect(result.meta?.fromCache).toBe(false);
    expect(dataCalls(fetchMock)).toHaveLength(1);
    expect((await get<InseeData>(CACHE_KEY))?.meta.generatedAt).toBe(sampleData.meta.generatedAt);
  });

  it('ignore un cache d’une autre version de format', async () => {
    await set(CACHE_KEY, { ...sampleData, meta: { ...sampleData.meta, formatVersion: 0 } });
    const fetchMock = stubFetch({ report, data: json });
    expect((await insee.load()).meta?.fromCache).toBe(false);
    expect(dataCalls(fetchMock)).toHaveLength(1);
  });

  it('utilise le cache hors ligne', async () => {
    await set(CACHE_KEY, sampleData);
    stubFetch({ report: null, data: null });
    expect((await insee.load()).meta?.fromCache).toBe(true);
  });

  it('télécharge quand même si le rapport est injoignable et le cache vide', async () => {
    stubFetch({ report: null, data: json });
    const result = await insee.load();
    expect(result.records).toHaveLength(3);
  });

  it('fonctionne quand IndexedDB est indisponible', async () => {
    vi.mocked(get).mockRejectedValueOnce(new Error('IndexedDB indisponible'));
    vi.mocked(set).mockRejectedValueOnce(new Error('IndexedDB indisponible'));
    stubFetch({ report, data: json });
    expect((await insee.load()).records).toHaveLength(3);
  });

  it('lève une erreur claire si le téléchargement échoue', async () => {
    stubFetch({ report, data: '', dataStatus: 404 });
    await expect(insee.load()).rejects.toThrow(/HTTP 404/);
  });

  it('refuse des données d’une autre version de format', async () => {
    const other = { ...sampleData, meta: { ...sampleData.meta, formatVersion: 99 } };
    stubFetch({ report: null, data: JSON.stringify(other) });
    await expect(insee.load()).rejects.toThrow(/version 99/);
  });

  it('clearCache vide le cache', async () => {
    await set(CACHE_KEY, sampleData);
    await insee.clearCache?.();
    expect(await get(CACHE_KEY)).toBeUndefined();
  });
});
