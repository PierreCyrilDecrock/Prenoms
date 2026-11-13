import { existsSync, readFileSync } from 'node:fs';

const html = readFileSync('index.html', 'utf8');
const attribute = (pattern: RegExp) => pattern.exec(html)?.[1] ?? '';

describe('métadonnées de publication', () => {
  it('a un titre, une description et une langue', () => {
    expect(html).toContain('<html lang="fr">');
    expect(attribute(/<title>([^<]+)<\/title>/)).toBe('Explorateur de prénoms');
    const description = attribute(/name="description"\s+content="([^"]+)"/);
    expect(description.length).toBeGreaterThan(70);
    expect(description.length).toBeLessThanOrEqual(160);
  });

  it('a les balises Open Graph nécessaires à un aperçu de lien, en adresses absolues', () => {
    for (const property of [
      'type',
      'title',
      'description',
      'url',
      'image',
      'locale',
      'site_name',
    ]) {
      expect(html, `og:${property}`).toMatch(
        new RegExp(`property="og:${property}"\\s+content="[^"]+"`),
      );
    }
    expect(attribute(/property="og:image"\s+content="([^"]+)"/)).toBe('%VITE_SITE_URL%og.png');
    expect(attribute(/property="og:url"\s+content="([^"]+)"/)).toBe('%VITE_SITE_URL%');
    expect(html).toContain('name="twitter:card" content="summary_large_image"');
    expect(readFileSync('.env', 'utf8')).toMatch(/^VITE_SITE_URL=https:\/\/[^\s]+\/$/m);
  });

  it('référence l’icône et le manifest sous le chemin de base', () => {
    expect(html).toContain('href="%BASE_URL%favicon.svg"');
    expect(html).toContain('href="%BASE_URL%apple-touch-icon.png"');
    expect(html).toContain('href="%BASE_URL%manifest.webmanifest"');
    expect(html).not.toContain('href="data:,"');
  });

  it('le manifest est valide et ses icônes existent', () => {
    const manifest = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8')) as {
      name: string;
      start_url: string;
      icons: { src: string; sizes: string }[];
    };
    expect(manifest.name).toBe('Explorateur de prénoms');
    // Chemins relatifs : le site vit sous un sous-chemin.
    expect(manifest.start_url).toBe('./');
    expect(manifest.icons.map((icon) => icon.sizes)).toEqual(
      expect.arrayContaining(['192x192', '512x512']),
    );
    for (const icon of manifest.icons) {
      expect(icon.src.startsWith('/')).toBe(false);
      expect(existsSync(`public/${icon.src}`), icon.src).toBe(true);
    }
    expect(existsSync('public/og.png')).toBe(true);
  });

  it('les données sont versionnées et le fichier brut ne peut pas être publié', () => {
    expect(existsSync('public/data/insee.json')).toBe(true);
    expect(existsSync('public/data/insee.report.json')).toBe(true);
    expect(readFileSync('.gitignore', 'utf8')).toContain('data/raw/*');
    expect(existsSync('public/data/raw')).toBe(false);
  });

  it('le README renvoie vers des fichiers qui existent', () => {
    const readme = readFileSync('README.md', 'utf8');
    const links = [...readme.matchAll(/\]\((?!https?:)([^)#]+)\)/g)].map((match) => match[1]!);
    expect(links.length).toBeGreaterThan(8);
    for (const link of links) expect(existsSync(link), link).toBe(true);
  });
});
