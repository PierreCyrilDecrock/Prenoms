import { useEffect } from 'react';
import { useNamesStore } from '@/state/namesStore';
import { DevPage } from '@/ui/DevPage';
import { ExplorerPage } from '@/ui/explorer/ExplorerPage';
import { NamePage } from '@/ui/NamePage';
import { useHashRoute } from '@/ui/useHashRoute';

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

  // Charge toutes les sources enregistrées au démarrage.
  useEffect(() => {
    void useNamesStore.getState().load();
  }, []);

  if (route === '/dev') return <DevPage />;
  if (route.startsWith(NAME_PREFIX)) {
    return <NamePage id={safeDecode(route.slice(NAME_PREFIX.length))} />;
  }
  return <ExplorerPage />;
}
