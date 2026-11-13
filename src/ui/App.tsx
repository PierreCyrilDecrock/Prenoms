import { lazy, Suspense, useEffect } from 'react';
import { useNamesStore } from '@/state/namesStore';
import { useUrlSync } from '@/state/useUrlSync';
import { MotionRoot } from '@/ui/motion';
import { Toaster } from '@/ui/Toaster';
import { ExplorerPage } from '@/ui/explorer/ExplorerPage';
import { NamePage } from '@/ui/NamePage';
import { useHashRoute } from '@/ui/useHashRoute';

// La page de diagnostic n'est téléchargée que si on l'ouvre.
const DevPage = lazy(() => import('@/ui/DevPage').then((module) => ({ default: module.DevPage })));

const NAME_PREFIX = '/prenom/';

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function App() {
  const route = useHashRoute();
  useUrlSync();

  // Charge toutes les sources enregistrées au démarrage.
  useEffect(() => {
    void useNamesStore.getState().load();
  }, []);

  let page = <ExplorerPage />;
  if (route === '/dev') {
    page = (
      <Suspense fallback={<p className="p-4 text-ink-muted">Chargement du diagnostic…</p>}>
        <DevPage />
      </Suspense>
    );
  }
  if (route.startsWith(NAME_PREFIX)) {
    page = <NamePage id={safeDecode(route.slice(NAME_PREFIX.length))} />;
  }

  return (
    <MotionRoot>
      {page}
      <Toaster />
    </MotionRoot>
  );
}
