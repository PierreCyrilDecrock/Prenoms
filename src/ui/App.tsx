import { useEffect } from 'react';
import { useNamesStore } from '@/state/namesStore';
import { DevPage } from '@/ui/DevPage';
import { HomePage } from '@/ui/HomePage';
import { useHashRoute } from '@/ui/useHashRoute';

export function App() {
  const route = useHashRoute();

  // Charge toutes les sources enregistrées au démarrage.
  useEffect(() => {
    void useNamesStore.getState().load();
  }, []);

  return route === '/dev' ? <DevPage /> : <HomePage />;
}
