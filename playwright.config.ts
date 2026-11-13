import { defineConfig, devices } from '@playwright/test';

/*
 * Scénarios de bout en bout.
 * - En local : `npm run e2e` construit le site sous /Prenoms/ et le sert avec vite preview.
 * - Contre le site publié : `E2E_BASE_URL=https://pierrecyrildecrock.github.io/Prenoms/ npm run e2e`.
 */
const PORT = 4174;
const localUrl = `http://localhost:${PORT}/Prenoms/`;
const baseURL = process.env.E2E_BASE_URL ?? localUrl;

export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.E2E_BASE_URL ? 1 : 0,
  reporter: [['list']],
  timeout: 45_000,
  use: { baseURL, trace: 'off', locale: 'fr-FR' },
  projects: [
    {
      name: 'mobile',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
        url: localUrl,
        env: { VITE_BASE: '/Prenoms/' },
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
