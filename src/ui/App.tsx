import { DevPage } from '@/ui/DevPage';
import { HomePage } from '@/ui/HomePage';
import { useHashRoute } from '@/ui/useHashRoute';

export function App() {
  const route = useHashRoute();
  return route === '/dev' ? <DevPage /> : <HomePage />;
}
