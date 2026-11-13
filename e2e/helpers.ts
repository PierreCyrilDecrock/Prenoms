import { expect, type Locator, type Page } from '@playwright/test';

/** Lignes de résultats réellement affichées (les lignes en cours de sortie sont ignorées). */
export const rows = (page: Page): Locator =>
  page.getByRole('list', { name: 'Résultats' }).getByRole('listitem');

/** Ouvre la liste (éventuellement avec des paramètres) et attend les prénoms. */
export async function openList(page: Page, query = ''): Promise<void> {
  await page.goto(query ? `./#/?${query}` : './');
  await expect(rows(page).first()).toBeVisible({ timeout: 30_000 });
}

/** Prénoms affichés en tête de liste. */
export async function topNames(page: Page, count = 5): Promise<string[]> {
  const names = await page
    .getByRole('list', { name: 'Résultats' })
    .locator('a > span:first-child > span:first-child')
    .allInnerTexts();
  return names.slice(0, count);
}

/** Nombre de résultats annoncé (« 1 234 prénoms » donne 1234). */
export async function resultCount(page: Page): Promise<number> {
  const text = await page.getByTestId('result-count').innerText();
  return Number(text.replace(/[^\d]/g, ''));
}

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 0) < 1024;

/**
 * Exécute une action dans le panneau de filtres : tiroir plein écran sur mobile
 * (ouvert puis refermé), barre latérale sur desktop.
 */
export async function withFilters(
  page: Page,
  action: (panel: Locator) => Promise<void>,
): Promise<void> {
  if (isMobile(page)) {
    await page.getByRole('button', { name: /^Filtres/ }).click();
    const drawer = page.getByRole('dialog', { name: 'Filtres' });
    await expect(drawer).toBeVisible();
    await action(drawer);
    await drawer.getByRole('button', { name: /^Voir / }).click();
    await expect(drawer).toBeHidden();
  } else {
    await action(page.getByRole('complementary', { name: 'Filtres' }));
  }
}

/** Groupe de contrôles d'un filtre, par son libellé. */
export const filterGroup = (panel: Locator, label: string) =>
  panel.getByRole('group', { name: label, exact: true }).first();

/** Attend que la tête de liste soit exactement celle attendue (les fondus de sortie finis). */
export async function expectTop(page: Page, expected: string[]): Promise<void> {
  await expect.poll(() => topNames(page, expected.length)).toEqual(expected);
}

/** Attend que la liste ne bouge plus, puis renvoie ses premiers prénoms. */
export async function settledTop(page: Page, count = 5): Promise<string[]> {
  let previous = '';
  await expect
    .poll(async () => {
      const current = (await topNames(page, count)).join('|');
      const stable = current === previous;
      previous = current;
      return stable;
    })
    .toBe(true);
  return topNames(page, count);
}
