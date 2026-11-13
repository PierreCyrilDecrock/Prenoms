import { expect, test } from '@playwright/test';

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

  test('icône, manifest et image d’aperçu sont servis sous le sous-chemin', async ({
    page,
    request,
  }) => {
    await page.goto('./');
    const href = (selector: string) => page.locator(selector).first().getAttribute('href');
    const iconHref = await href('link[rel="icon"]');
    const manifestHref = await href('link[rel="manifest"]');
    expect(iconHref).toMatch(/\/Prenoms\/favicon\.svg$/);

    const origin = new URL(page.url()).origin;
    const icon = await request.get(origin + iconHref!);
    expect(icon.ok()).toBe(true);
    expect(icon.headers()['content-type']).toContain('svg');

    const manifestResponse = await request.get(origin + manifestHref!);
    expect(manifestResponse.ok()).toBe(true);
    const manifest = (await manifestResponse.json()) as { name: string; icons: { src: string }[] };
    expect(manifest.name).toBe('Explorateur de prénoms');
    for (const item of manifest.icons) {
      const response = await request.get(new URL(item.src, origin + manifestHref!).href);
      expect(response.ok(), item.src).toBe(true);
    }

    const image = await request.get(new URL('og.png', page.url().split('#')[0]).href);
    expect(image.ok()).toBe(true);
    expect(image.headers()['content-type']).toContain('image/png');
  });

  test('le fichier brut de l’Insee n’est pas publié, les données générées le sont', async ({
    page,
    request,
  }) => {
    await page.goto('./');
    const root = page.url().split('#')[0]!;
    const raw = await request.get(new URL('data/raw/prenoms-2023-nat.csv', root).href);
    // Une erreur 404, ou la page de repli du serveur local : jamais le CSV.
    const rawBody = await raw.text();
    expect(raw.status() === 404 || rawBody.includes('<!doctype html>')).toBe(true);
    expect(rawBody).not.toContain('sexe;preusuel');

    const data = await request.get(new URL('data/insee.report.json', root).href);
    expect(data.ok()).toBe(true);
    expect(((await data.json()) as { meta: { nameCount: number } }).meta.nameCount).toBeGreaterThan(
      30_000,
    );
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
