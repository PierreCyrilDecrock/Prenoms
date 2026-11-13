import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { filterGroup, isMobile, openList, rows, withFilters } from './helpers';

/** Audit axe (WCAG 2.1 A et AA) de l'écran affiché ; renvoie les violations, résumées. */
async function audit(page: Page) {
  // Les animations d'apparition passent par une opacité partielle : on attend qu'elles finissent.
  await page.waitForTimeout(500);
  // Le paquet axe embarque ses propres types Playwright, d'une autre version.
  const results = await new AxeBuilder({ page } as never)
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
    .analyze();
  return results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    nodes: violation.nodes.length,
    example: violation.nodes[0]?.html.slice(0, 160),
    detail: violation.nodes[0]?.failureSummary?.slice(0, 200),
  }));
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`accessibilité (thème ${colorScheme === 'light' ? 'clair' : 'sombre'})`, () => {
    test.use({ colorScheme });

    test('liste des résultats', async ({ page }) => {
      await openList(page);
      expect(await audit(page)).toEqual([]);
    });

    test('liste filtrée, avec pastilles et recherche surlignée', async ({ page }) => {
      await openList(page, 'q=mar&f.gender=f&f.trend=up&f.length=-6');
      expect(await audit(page)).toEqual([]);
    });

    test('panneau de filtres', async ({ page }) => {
      await openList(page);
      if (isMobile(page)) {
        await page.getByRole('button', { name: /^Filtres/ }).click();
        await expect(page.getByRole('dialog', { name: 'Filtres' })).toBeVisible();
      }
      expect(await audit(page)).toEqual([]);
    });

    test('aucun résultat', async ({ page }) => {
      await openList(page);
      await page.getByRole('searchbox').fill('zzzzzz');
      await expect(page.getByRole('heading', { name: 'Aucun prénom ne correspond' })).toBeVisible();
      expect(await audit(page)).toEqual([]);
    });

    test('menu d’export ouvert', async ({ page }) => {
      await openList(page);
      await page.getByRole('button', { name: 'Exporter' }).click();
      expect(await audit(page)).toEqual([]);
    });

    test('fiche d’un prénom', async ({ page }) => {
      await page.goto('./#/prenom/camille');
      await expect(page.getByRole('heading', { level: 1, name: 'Camille' })).toBeVisible({
        timeout: 30_000,
      });
      expect(await audit(page)).toEqual([]);
    });

    test('page de diagnostic', async ({ page }) => {
      await page.goto('./#/dev');
      await expect(page.getByTestId('load-status')).toContainText('prénoms chargés', {
        timeout: 30_000,
      });
      expect(await audit(page)).toEqual([]);
    });
  });
}

test.describe('clavier et lecteur d’écran', () => {
  test('le focus reste visible sur chaque élément atteint au clavier', async ({ page }) => {
    test.skip(isMobile(page), 'navigation au clavier : desktop');
    await openList(page);
    const seen = new Set<string>();
    for (let step = 0; step < 45; step++) {
      await page.keyboard.press('Tab');
      const focus = await page.evaluate(() => {
        const element = document.activeElement as HTMLElement | null;
        if (!element || element === document.body) return null;
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          what: `${element.tagName.toLowerCase()} ${(element.getAttribute('aria-label') ?? element.textContent ?? element.id).trim().slice(0, 30)}`,
          outlined: style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2,
          onScreen: rect.width > 0 && rect.bottom > 0 && rect.top < innerHeight,
        };
      });
      expect(focus, `étape ${step}`).not.toBeNull();
      expect(focus!.outlined, `contour de focus sur « ${focus!.what} »`).toBe(true);
      expect(focus!.onScreen, `« ${focus!.what} » visible à l’écran`).toBe(true);
      seen.add(focus!.what.split(' ')[0]!);
    }
    // Le parcours traverse des champs, des listes déroulantes et des boutons.
    for (const tag of ['input', 'select', 'button']) expect([...seen]).toContain(tag);
  });

  test('le lien d’évitement mène directement aux résultats', async ({ page }) => {
    test.skip(isMobile(page), 'navigation au clavier : desktop');
    await openList(page);
    await page.keyboard.press('Tab');
    const skip = page.getByRole('button', { name: 'Aller aux résultats' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
    // Quelques tabulations suffisent ensuite pour atteindre un prénom.
    for (let step = 0; step < 4; step++) await page.keyboard.press('Tab');
    const inList = await page
      .getByRole('list', { name: 'Résultats' })
      .evaluate((list) => list.contains(document.activeElement));
    expect(inList).toBe(true);
  });

  test('une fiche s’ouvre au clavier et le tiroir garde le focus', async ({ page }) => {
    await openList(page);
    const firstLink = rows(page).first().getByRole('link');
    await firstLink.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 1, name: 'Marie' })).toBeVisible();

    if (!isMobile(page)) return;
    await page.goBack();
    await page.getByRole('button', { name: /^Filtres/ }).click();
    const drawer = page.getByRole('dialog', { name: 'Filtres' });
    await expect(drawer.getByRole('button', { name: 'Fermer' })).toBeFocused();
    for (let step = 0; step < 80; step++) await page.keyboard.press('Tab');
    expect(await drawer.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Escape');
    await expect(drawer).toBeHidden();
    await expect(page.getByRole('button', { name: /^Filtres/ })).toBeFocused();
  });

  test('le nombre de résultats est annoncé dans une zone « status »', async ({ page }) => {
    await openList(page);
    const status = page.getByRole('status').filter({ hasText: 'prénoms' });
    await expect(status).toHaveCount(1);
    await page.getByRole('searchbox').fill('lea');
    await expect(status).toHaveText('50 prénoms');
    await withFilters(page, async (panel) => {
      await filterGroup(panel, 'Accents').getByLabel('Avec accent').check();
    });
    await expect(status).toHaveText(/^\d+ prénoms?$/);
  });
});
