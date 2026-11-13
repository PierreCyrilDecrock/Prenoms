import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import {
  expectTop,
  filterGroup,
  isMobile,
  openList,
  resultCount,
  rows,
  settledTop,
  topNames,
  withFilters,
} from './helpers';

test.describe('parcours principaux', () => {
  test('la liste affiche tous les prénoms, les plus donnés en tête', async ({ page }) => {
    await openList(page);
    expect(await resultCount(page)).toBeGreaterThan(30_000);
    await expectTop(page, ['Marie', 'Jean', 'Pierre']);
    // Liste virtualisée : seules quelques dizaines de lignes existent.
    expect(await rows(page).count()).toBeLessThan(60);
  });

  test('recherche : insensible aux accents, trois modes, texte surligné', async ({ page }) => {
    await openList(page);
    const search = page.getByRole('searchbox', { name: 'Rechercher un prénom' });

    await search.fill('lea');
    await expect(page.getByTestId('result-count')).toHaveText('50 prénoms');
    const plain = await settledTop(page, 10);
    await search.fill('Léa');
    await expect(page.getByTestId('result-count')).toHaveText('50 prénoms');
    expect(await settledTop(page, 10)).toEqual(plain);
    expect(plain[0]).toBe('Léa');
    await expect(rows(page).first().locator('mark')).toHaveText('Léa');

    await page.getByLabel('Mode de recherche').selectOption('contains');
    await expect(page.getByTestId('result-count')).toHaveText('132 prénoms');
    await page.getByLabel('Mode de recherche').selectOption('endsWith');
    await expect(page.getByTestId('result-count')).toHaveText('30 prénoms');

    await search.press('Escape');
    await expect(search).toHaveValue('');
    expect(await resultCount(page)).toBeGreaterThan(30_000);
  });

  test('raccourci « / » : place le curseur dans la recherche', async ({ page }) => {
    test.skip(isMobile(page), 'raccourci clavier : desktop uniquement');
    await openList(page);
    await page.keyboard.press('/');
    await expect(page.getByRole('searchbox')).toBeFocused();
  });

  test('filtres : ajout, combinaison, pastilles, retrait, réinitialisation', async ({ page }) => {
    await openList(page);
    const all = await resultCount(page);

    await withFilters(page, async (panel) => {
      await filterGroup(panel, 'Sexe et mixité').getByLabel('Filles').check();
    });
    await expect(page.getByTestId('result-count')).toHaveText('22 674 prénoms');

    await withFilters(page, async (panel) => {
      await filterGroup(panel, 'Tendance').getByLabel('En hausse').check();
      await filterGroup(panel, 'Longueur').getByLabel('Lettres max.').fill('4');
    });
    const combined = await resultCount(page);
    expect(combined).toBeLessThan(7703);
    expect(combined).toBeGreaterThan(0);

    const chips = page.getByRole('list', { name: 'Filtres actifs' });
    await expect(chips.getByRole('button')).toHaveCount(3);
    await expect(chips).toContainText('Sexe et mixité : filles');
    await expect(chips).toContainText('Longueur : au plus 4 lettres');
    await expect(chips).toContainText('Tendance : en hausse');
    if (isMobile(page)) {
      await expect(page.getByRole('button', { name: /^Filtres/ })).toContainText('3');
    }

    await chips.getByRole('button', { name: /Retirer le filtre Longueur/ }).click();
    await expect(page.getByTestId('result-count')).toHaveText('7 703 prénoms');
    await expect(chips.getByRole('button')).toHaveCount(2);

    await page.getByRole('button', { name: 'Tout réinitialiser' }).click();
    await expect(chips.getByRole('button')).toHaveCount(0);
    expect(await resultCount(page)).toBe(all);
  });

  test('aucun résultat : message et réinitialisation', async ({ page }) => {
    await openList(page);
    await page.getByRole('searchbox').fill('zzzzzz');
    await expect(page.getByRole('heading', { name: 'Aucun prénom ne correspond' })).toBeVisible();
    await page.getByRole('main').getByRole('button', { name: 'Tout réinitialiser' }).last().click();
    await expect(rows(page).first()).toBeVisible();
  });

  test('tri : chaque changement réordonne, le sens s’inverse', async ({ page }) => {
    await openList(page);
    await page.getByLabel('Trier par').selectOption('alphabetical');
    await page.getByRole('button', { name: /Sens du tri : décroissant/ }).click();
    await expect.poll(() => topNames(page, 3)).toEqual(["A'Lia", 'Aaban', 'Aadam']);
    await page.getByRole('button', { name: /Sens du tri : croissant/ }).click();
    await expect.poll(async () => (await topNames(page, 1))[0]).toMatch(/^Zy/);

    await page.getByLabel('Trier par').selectOption('recentPopularity');
    await expect.poll(() => topNames(page, 3)).toEqual(['Gabriel', 'Léo', 'Raphaël']);
  });

  test('fiche d’un prénom : courbe, repères, retour à la même vue', async ({ page }) => {
    await openList(page, 'q=cam');
    await rows(page).filter({ hasText: 'Camille' }).first().getByRole('link').click();
    await expect(page).toHaveURL(/#\/prenom\/camille$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Camille' })).toBeVisible();
    await expect(
      page.getByRole('img', { name: /Naissances par année du prénom Camille/ }),
    ).toBeVisible();
    await expect(page.getByText('Filles (trait plein)')).toBeVisible();
    await expect(page.getByText('Garçons (pointillés)')).toBeVisible();
    const facts = page.getByRole('region', { name: 'Repères' });
    await expect(facts).toContainText('1998');
    await expect(facts).toContainText('1900');
    await expect(facts).toContainText('2025');
    await expect(page).toHaveTitle('Camille – Explorateur de prénoms');

    await page.getByRole('link', { name: '← Tous les prénoms' }).click();
    await expect(page).toHaveURL(/#\/\?q=cam$/);
    await expect(page.getByRole('searchbox')).toHaveValue('cam');
    await expect(rows(page).first()).toBeVisible();
  });

  test('prénom inconnu : page dédiée', async ({ page }) => {
    await page.goto('./#/prenom/prenom-qui-n-existe-pas');
    await expect(page.getByRole('heading', { name: 'Prénom introuvable' })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('lien partagé : la même vue dans un navigateur vierge', async ({ page, browser }) => {
    await openList(page);
    await page.getByRole('searchbox').fill('mar');
    await withFilters(page, async (panel) => {
      await filterGroup(panel, 'Sexe et mixité').getByLabel('Filles').check();
      await filterGroup(panel, 'Tendance').getByLabel('En hausse').check();
    });
    await page.getByLabel('Trier par').selectOption('recentPopularity');
    await expect(page).toHaveURL(/q=mar&f\.gender=f&f\.trend=up&s=recentPopularity&d=desc$/);
    const original = { count: await resultCount(page), names: await settledTop(page, 8) };

    const context = await browser.newContext({ viewport: page.viewportSize() });
    const other = await context.newPage();
    await other.goto(page.url());
    await expect(rows(other).first()).toBeVisible({ timeout: 30_000 });
    expect({ count: await resultCount(other), names: await settledTop(other, 8) }).toEqual(
      original,
    );
    await expect(other.getByRole('searchbox')).toHaveValue('mar');
    await expect(other.getByLabel('Trier par')).toHaveValue('recentPopularity');
    await expect(
      other.getByRole('list', { name: 'Filtres actifs' }).getByRole('button'),
    ).toHaveCount(2);
    await context.close();
  });

  test('lien avec des paramètres invalides : ignorés sans erreur', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    await openList(page, 'q=lou&f.gender=zzz&f.inconnu=1&s=nimporte&m=x');
    await expect(page.getByTestId('result-count')).toHaveText('324 prénoms');
    await expect(page.getByLabel('Trier par')).toHaveValue('totalPopularity');
    expect(errors).toEqual([]);
  });

  test('favoris : conservés après rechargement, filtrables', async ({ page }) => {
    await openList(page);
    await page.getByRole('button', { name: 'Ajouter Marie aux favoris' }).click();
    await page.getByRole('button', { name: 'Ajouter Pierre aux favoris' }).click();
    await page.reload();
    await expect(rows(page).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('button', { name: 'Retirer Marie des favoris' })).toBeVisible();

    await withFilters(page, async (panel) => {
      await filterGroup(panel, 'Favoris').getByLabel('Favoris uniquement').check();
    });
    await expect(page.getByTestId('result-count')).toHaveText('2 prénoms');
    await expectTop(page, ['Marie', 'Pierre']);
    await expect(page).toHaveURL(/f\.favorites=only/);
  });

  test('export : CSV avec BOM et JSON de la liste filtrée', async ({ page }) => {
    await openList(page, 'q=l%C3%A9a&s=alphabetical&d=asc');
    await expect(page.getByTestId('result-count')).toHaveText('50 prénoms');

    await page.getByRole('button', { name: 'Exporter' }).click();
    const [csvDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /^CSV/ }).click(),
    ]);
    expect(csvDownload.suggestedFilename()).toMatch(/^prenoms-\d{4}-\d{2}-\d{2}\.csv$/);
    const csv = await readFile(await csvDownload.path());
    expect(csv.subarray(0, 3).toString('hex')).toBe('efbbbf');
    const lines = csv.toString('utf8').slice(1).trimEnd().split('\r\n');
    expect(lines).toHaveLength(51);
    expect(lines[0]).toContain('id;prenom;');
    expect(lines[0]).toContain('insee.total');
    expect(lines[1]).toMatch(/^lea;Léa;/);

    await page.getByRole('button', { name: 'Exporter' }).click();
    const [jsonDownload] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /^JSON/ }).click(),
    ]);
    const json = JSON.parse(await readFile(await jsonDownload.path(), 'utf8')) as {
      prenom: string;
    }[];
    expect(json).toHaveLength(50);
    expect(json[0]!.prenom).toBe('Léa');
  });

  test('page de diagnostic : SHA du build et données chargées', async ({ page }) => {
    await page.goto('./#/dev');
    await expect(page.getByTestId('build-sha')).toHaveText(/^[0-9a-f]{40}$|^dev$/);
    await expect(page.getByTestId('load-status')).toContainText('prénoms chargés', {
      timeout: 30_000,
    });
  });
});
