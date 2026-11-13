/**
 * Génère les images du projet avec un navigateur sans interface :
 * - icônes PNG (public/) à partir de public/favicon.svg ;
 * - image d'aperçu de lien public/og.png (1200 × 630) ;
 * - captures d'écran du README (docs/img/), prises sur un site en cours d'exécution.
 *
 * Usage : npm run capture [-- http://localhost:4173/Prenoms/]
 * (lancer d'abord `VITE_BASE=/Prenoms/ npm run build && VITE_BASE=/Prenoms/ npm run preview`)
 */
import { readFileSync } from 'node:fs';
import { chromium, type Page } from '@playwright/test';

const baseUrl = process.argv[2] ?? 'http://localhost:4173/Prenoms/';
const svg = readFileSync('public/favicon.svg', 'utf8');
const svgUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const ROWS = 'ul[aria-label="Résultats"] li a';

const browser = await chromium.launch();

// Icônes : le SVG rendu à la taille voulue (fond plein pour l'icône Apple).
for (const [file, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
] as const) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(
    `<body style="margin:0;background:#4338ca"><img src="${svgUrl}" width="${size}" height="${size}" style="display:block"></body>`,
  );
  await page.screenshot({
    path: `public/${file}`,
    omitBackground: file !== 'apple-touch-icon.png',
  });
  await page.close();
}

// Image d'aperçu de lien.
{
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.setContent(`<!doctype html><html lang="fr"><body style="margin:0;width:1200px;height:630px;
    background:#faf9f6;color:#1c1a17;font-family:Inter,ui-sans-serif,system-ui,sans-serif;display:flex;
    flex-direction:column;justify-content:center;padding:0 96px;box-sizing:border-box">
    <img src="${svgUrl}" width="112" height="112" alt="">
    <h1 style="font-size:84px;line-height:1.05;margin:40px 0 0;letter-spacing:-2px">Explorateur de prénoms</h1>
    <p style="font-size:36px;line-height:1.35;margin:24px 0 0;color:#5c5750;white-space:nowrap">Plus de 43 000 prénoms donnés en France depuis 1900.<br>Rechercher, filtrer, trier.</p>
    <p style="font-size:26px;margin:48px 0 0;color:#4338ca;font-weight:600">Source : Insee, fichier des prénoms</p>
  </body></html>`);
  await page.screenshot({ path: 'public/og.png' });
  await page.close();
}

// Captures du README.
async function open(page: Page, hash = '') {
  await page.goto(baseUrl + hash);
  await page.waitForSelector(hash.includes('prenom/') ? 'h1' : ROWS, { timeout: 30_000 });
  await page.waitForTimeout(900);
}

{
  const context = await browser.newContext({
    viewport: { width: 390, height: 780 },
    deviceScaleFactor: 2,
    hasTouch: true,
  });
  const page = await context.newPage();
  await open(page);
  await page.screenshot({ path: 'docs/img/mobile-liste.png' });
  await open(page, '#/?q=mar&f.gender=f&f.trend=up&s=recentPopularity&d=desc');
  await page.screenshot({ path: 'docs/img/mobile-recherche.png' });
  await page.getByRole('button', { name: /^Filtres/ }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: 'docs/img/mobile-filtres.png' });
  await open(page, '#/prenom/camille');
  await page.screenshot({ path: 'docs/img/mobile-fiche.png' });
  await context.close();
}
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await open(page, '#/?q=l%C3%A9&f.length=-6&s=recentPopularity&d=desc');
  await page.screenshot({ path: 'docs/img/desktop-liste.png' });
  await open(page, '#/prenom/camille');
  await page.screenshot({ path: 'docs/img/desktop-fiche.png' });
  await context.close();
}
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    colorScheme: 'dark',
  });
  const page = await context.newPage();
  await open(page);
  await page.screenshot({ path: 'docs/img/desktop-sombre.png' });
  await context.close();
}

await browser.close();
console.log('Images générées : public/*.png, docs/img/*.png');
