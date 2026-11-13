import { expect, test, type Page } from '@playwright/test';

/**
 * Télécharge une adresse depuis la page elle-même (relative au site), pour passer par le même
 * réseau que le navigateur. Le texte n'est lu que pour les contenus textuels.
 */
async function fetchInPage(page: Page, url: string) {
  return page.evaluate(async (target) => {
    const response = await fetch(new URL(target, document.baseURI).href, { cache: 'no-store' });
    const type = response.headers.get('content-type') ?? '';
    const textual = /json|text|svg|csv/.test(type);
    return {
      ok: response.ok,
      status: response.status,
      type,
      text: textual ? await response.text() : '',
    };
  }, url);
}

test.describe('publication', () => {
  test('la page a son titre, sa description et ses balises d’aperçu de lien', async ({ page }) => {
    await page.goto('./');
    await expect(page).toHaveTitle('Explorateur de prénoms');
    const content = (selector: string) => page.locator(selector).getAttribute('content');
    expect(await content('meta[name="description"]')).toContain('32 000 prénoms');
    expect(await content('meta[property="og:title"]')).toBe('Explorateur de prénoms');
    expect(await content('meta[property="og:description"]')).toContain('Insee');
    expect(await content('meta[property="og:url"]')).toMatch(/^https:\/\/.+\/Prenoms\/$/);
    expect(await content('meta[property="og:image"]')).toMatch(/^https:\/\/.+\/Prenoms\/og\.png$/);
  });

  test('icône, manifest et image d’aperçu sont servis sous le sous-chemin', async ({ page }) => {
    await page.goto('./');
    const href = (selector: string) => page.locator(selector).first().getAttribute('href');
    const iconHref = await href('link[rel="icon"]');
    const manifestHref = await href('link[rel="manifest"]');
    expect(iconHref).toMatch(/\/Prenoms\/favicon\.svg$/);

    const icon = await fetchInPage(page, iconHref!);
    expect(icon.ok).toBe(true);
    expect(icon.type).toContain('svg');

    const manifestResponse = await fetchInPage(page, manifestHref!);
    expect(manifestResponse.ok).toBe(true);
    const manifest = JSON.parse(manifestResponse.text) as {
      name: string;
      icons: { src: string }[];
    };
    expect(manifest.name).toBe('Explorateur de prénoms');
    const manifestUrl = new URL(manifestHref!, page.url()).href;
    for (const item of manifest.icons) {
      const response = await fetchInPage(page, new URL(item.src, manifestUrl).href);
      expect(response.ok, item.src).toBe(true);
    }

    const image = await fetchInPage(page, 'og.png');
    expect(image.ok).toBe(true);
    expect(image.type).toContain('image/png');
  });

  test('le fichier brut de l’Insee n’est pas publié, les données générées le sont', async ({
    page,
  }) => {
    await page.goto('./');
    const raw = await fetchInPage(page, 'data/raw/prenoms-2023-nat.csv');
    // Une erreur 404, ou la page de repli du serveur local : jamais le CSV.
    expect(raw.status === 404 || raw.text.includes('<!doctype html>')).toBe(true);
    expect(raw.text).not.toContain('sexe;preusuel');

    const data = await fetchInPage(page, 'data/insee.report.json');
    expect(data.ok).toBe(true);
    const report = JSON.parse(data.text) as { meta: { nameCount: number } };
    expect(report.meta.nameCount).toBeGreaterThan(30_000);
  });

  test('le pied de page crédite la source et mène discrètement au diagnostic', async ({ page }) => {
    await page.goto('./');
    const footer = page.getByRole('contentinfo');
    await expect(footer).toContainText('Source : Insee');
    await footer.getByRole('link', { name: 'Diagnostic' }).click();
    await expect(page).toHaveURL(/#\/dev$/);
    await expect(page.getByRole('heading', { name: /Étape 12/ })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('publication-checks').getByText('OK')).toHaveCount(4);
  });
});
