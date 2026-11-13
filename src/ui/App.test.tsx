import { act, fireEvent, render, screen } from '@testing-library/react';
import { sampleData } from '@/sources/insee/facts.test';
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

const report = {
  meta: {
    formatVersion: 1,
    generatedAt: '2026-01-01T00:00:00.000Z',
    sourceFile: 'exemple.csv',
    yearMin: 1900,
    yearMax: 2023,
    nameCount: 1234,
    totalBirths: 56789,
  },
  csv: { rows: 100, births: 60000, distinctNames: 1300 },
  excluded: {
    unknownYear: { rows: 7, births: 70 },
    rareNames: { rows: 3, births: 30 },
    invalid: { rows: 0, births: 0 },
    namesWithoutKnownYear: 5,
  },
  mergedVariants: 61,
  size: { raw: 3 * 1024 * 1024, gzip: 1024 * 1024 },
};

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('insee.report.json')
          ? new Response(JSON.stringify(report))
          : new Response(JSON.stringify(sampleData)),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
    expect(screen.getByTestId('registry-source')).toHaveTextContent('insee');
    expect(screen.getByTestId('registry-champ calculé')).toHaveTextContent('femaleShare');
    expect(screen.getByTestId('registry-filtre')).toHaveTextContent('example');
    expect(screen.getByTestId('registry-tri')).toHaveTextContent('example');
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

  it('étape 3 : affiche les statistiques du rapport INSEE', async () => {
    window.location.hash = '#/dev';
    render(<App />);
    const section = await screen.findByTestId('insee-report');
    expect(section).toHaveTextContent(/1\s?234/);
    expect(section).toHaveTextContent('1900–2023');
    expect(section).toHaveTextContent('3 Mo');
    expect(section).toHaveTextContent('1 Mo');
    expect(section).toHaveTextContent('10 sur 100');
    expect(screen.getByRole('link', { name: 'Ouvrir data/insee.json' })).toHaveAttribute(
      'href',
      '/data/insee.json',
    );
  });

  it('étape 3 : signale un rapport introuvable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 404 })),
    );
    window.location.hash = '#/dev';
    render(<App />);
    expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 404');
  });

  it('étape 4 : charge les prénoms au démarrage et les affiche', async () => {
    render(<App />);
    expect(await screen.findByText('3 prénoms chargés.')).toBeInTheDocument();
    await act(async () => {
      window.location.hash = '#/dev';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(screen.getByTestId('load-status')).toHaveTextContent('3 prénoms chargés');
    expect(screen.getByTestId('origin-insee')).toHaveTextContent('réseau');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText('Échantillon de 3 prénoms')).toBeInTheDocument();
    expect(screen.getByText(/"femaleShare":0.769/)).toBeInTheDocument();
  });

  it('étape 5 : recherche insensible aux accents, avec trois modes', async () => {
    window.location.hash = '#/dev';
    render(<App />);
    await screen.findByText('Échantillon de 3 prénoms');
    const input = screen.getByLabelText('Recherche brute');
    const summary = screen.getByTestId('query-summary');
    const results = screen.getByTestId('query-results');
    expect(summary).toHaveTextContent(/3 résultats sur 3 en .* ms/);

    fireEvent.change(input, { target: { value: 'lea' } });
    expect(summary).toHaveTextContent('1 résultat sur 3');
    const plain = results.textContent;
    fireEvent.change(input, { target: { value: 'Léa' } });
    expect(results.textContent).toBe(plain);
    expect(results).toHaveTextContent('Léa');

    fireEvent.change(input, { target: { value: 'ba' } });
    expect(summary).toHaveTextContent('0 résultat sur 3');
    fireEvent.click(screen.getByLabelText('Contient'));
    expect(results).toHaveTextContent('Jean-Baptiste');
    fireEvent.change(input, { target: { value: 'LLE' } });
    fireEvent.click(screen.getByLabelText('Finit par'));
    expect(results).toHaveTextContent('Camille');
  });
});
