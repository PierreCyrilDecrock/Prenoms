import { expect, test } from '@playwright/test';
import { filterGroup, openList, rows, withFilters } from './helpers';

/** Budget de réponse ressentie d'une recherche ou d'un filtre, en millisecondes. */
const RESPONSE_BUDGET_MS = 100;

/**
 * Temps entre une action et la mise à jour du nombre de résultats annoncé, mesuré dans la page.
 * `act` déclenche l'action ; la mesure s'arrête à la première modification du compteur.
 */
async function measureResponse(
  page: import('@playwright/test').Page,
  act: () => Promise<void>,
): Promise<number> {
  await page.evaluate(() => {
    const target = document.querySelector('[data-testid="result-count"]')!;
    const state = { start: 0, end: 0 };
    (window as unknown as { __measure: typeof state }).__measure = state;
    const mark = () => {
      if (state.start === 0) state.start = performance.now();
    };
    // Selon le contrôle, la mise à jour part d'un clic, d'une frappe ou d'un changement.
    window.addEventListener('click', mark, { capture: true, once: true });
    window.addEventListener('keydown', mark, { capture: true, once: true });
    window.addEventListener('input', mark, { capture: true, once: true });
    window.addEventListener('change', mark, { capture: true, once: true });
    new MutationObserver((_records, observer) => {
      state.end = performance.now();
      observer.disconnect();
    }).observe(target, { childList: true, characterData: true, subtree: true });
  });
  await act();
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { __measure: { end: number } }).__measure.end),
    )
    .toBeGreaterThan(0);
  return page.evaluate(() => {
    const { start, end } = (window as unknown as { __measure: { start: number; end: number } })
      .__measure;
    return end - start;
  });
}

test.describe('performance sur les données réelles', () => {
  test('chargement initial : la liste s’affiche rapidement', async ({ page }, testInfo) => {
    const start = Date.now();
    await openList(page);
    const elapsed = Date.now() - start;
    const cached = Date.now();
    await page.reload();
    await expect(rows(page).first()).toBeVisible();
    const fromCache = Date.now() - cached;
    testInfo.annotations.push({
      type: 'mesure',
      description: `premier affichage ${elapsed} ms, rechargement depuis le cache ${fromCache} ms`,
    });
    console.log(
      `[${testInfo.project.name}] premier affichage : ${elapsed} ms ; depuis le cache : ${fromCache} ms`,
    );
    // Garde-fou large : la durée dépend du réseau quand le test vise le site publié.
    expect(elapsed).toBeLessThan(15_000);
    expect(fromCache).toBeLessThan(5_000);
  });

  test(`une recherche et un filtre répondent en moins de ${RESPONSE_BUDGET_MS} ms`, async ({
    page,
  }, testInfo) => {
    await openList(page);
    const search = page.getByRole('searchbox');

    const typing: number[] = [];
    for (const letter of ['m', 'a', 'r', 'i']) {
      typing.push(await measureResponse(page, () => search.press(letter)));
    }
    const clearing = await measureResponse(page, () => search.fill(''));

    let filter = 0;
    await withFilters(page, async (panel) => {
      filter = await measureResponse(page, () =>
        filterGroup(panel, 'Sexe et mixité').getByLabel('Filles').check(),
      );
    });

    const worst = Math.max(...typing, clearing, filter);
    const summary =
      `frappes ${typing.map((value) => value.toFixed(0)).join(', ')} ms ; ` +
      `effacement ${clearing.toFixed(0)} ms ; filtre ${filter.toFixed(0)} ms`;
    testInfo.annotations.push({ type: 'mesure', description: summary });
    console.log(`[${testInfo.project.name}] ${summary}`);
    expect(worst, summary).toBeLessThan(RESPONSE_BUDGET_MS);
  });
});
