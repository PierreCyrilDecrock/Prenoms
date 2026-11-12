import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

/** SHA du commit : fourni par GitHub Actions, sinon lu dans git, sinon "dev". */
function resolveSha(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;
  try {
    return execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'dev';
  }
}

const buildInfo = { sha: resolveSha(), date: new Date().toISOString() };

/** Publie version.json à côté du site, pour vérifier un déploiement sans navigateur. */
function versionFile(): Plugin {
  return {
    name: 'version-file',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify(buildInfo),
      });
    },
  };
}

export default defineConfig({
  // Sous-chemin GitHub Pages, ex. VITE_BASE=/Prenoms/
  base: process.env.VITE_BASE ?? '/',
  plugins: [react(), tailwindcss(), versionFile()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  define: {
    __BUILD_SHA__: JSON.stringify(buildInfo.sha),
    __BUILD_DATE__: JSON.stringify(buildInfo.date),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    css: false,
  },
});
