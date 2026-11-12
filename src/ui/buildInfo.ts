/** Informations injectées par Vite au build (voir vite.config.ts). */
export const buildInfo = {
  projectName: 'Explorateur de prénoms',
  sha: typeof __BUILD_SHA__ === 'string' ? __BUILD_SHA__ : 'dev',
  date: typeof __BUILD_DATE__ === 'string' ? __BUILD_DATE__ : new Date(0).toISOString(),
};
