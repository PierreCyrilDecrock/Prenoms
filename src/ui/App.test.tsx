import { act, fireEvent, render, screen } from '@testing-library/react';
import { App } from '@/ui/App';
import { parseHashPath } from '@/ui/useHashRoute';

describe('parseHashPath', () => {
  it('renvoie "/" pour un hash vide ou invalide', () => {
    expect(parseHashPath('')).toBe('/');
    expect(parseHashPath('#')).toBe('/');
    expect(parseHashPath('#dev')).toBe('/');
  });

  it('extrait le chemin et ignore les paramètres', () => {
    expect(parseHashPath('#/dev')).toBe('/dev');
    expect(parseHashPath('#/dev?x=1')).toBe('/dev');
  });
});

describe('App', () => {
  afterEach(() => {
    window.location.hash = '';
  });

  it("affiche la page d'accueil par défaut", () => {
    render(<App />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Explorateur de prénoms' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Page de diagnostic' })).toHaveAttribute(
      'href',
      '#/dev',
    );
  });

  it('affiche la page de diagnostic sur #/dev, avec le SHA et la date de build', () => {
    window.location.hash = '#/dev';
    render(<App />);
    expect(screen.getByText('Page de diagnostic')).toBeVisible();
    expect(screen.getByTestId('build-sha')).not.toBeEmptyDOMElement();
    expect(screen.getByTestId('build-date')).toHaveAttribute('dateTime');
    expect(screen.getByRole('heading', { name: /Étape 1/ })).toBeVisible();
  });

  it('étape 2 : liste les registres et normalise un prénom en direct', () => {
    window.location.hash = '#/dev';
    render(<App />);
    for (const kind of ['source', 'champ calculé', 'filtre', 'tri']) {
      expect(screen.getByTestId(`registry-${kind}`)).toHaveTextContent('example');
    }
    fireEvent.change(screen.getByLabelText('Prénom à normaliser'), {
      target: { value: ' ÉLODIE  Noël ' },
    });
    expect(screen.getByTestId('normalized')).toHaveTextContent('[elodie noel]');
  });

  it('réagit au changement de hash', async () => {
    render(<App />);
    await act(async () => {
      window.location.hash = '#/dev';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByText('Page de diagnostic')).toBeVisible();
  });
});
