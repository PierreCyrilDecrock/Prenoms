import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { filters, sorts } from '@/core';
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

/** Ouvre la page de diagnostic (chargée à la demande) et attend son affichage. */
async function renderDev() {
  window.location.hash = '#/dev';
  render(<App />);
  await screen.findByText('Page de diagnostic');
}

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

  it('affiche la page de diagnostic sur #/dev, avec le SHA et la date de build', async () => {
    await renderDev();
    expect(screen.getByText('Page de diagnostic')).toBeVisible();
    expect(screen.getByTestId('build-sha')).not.toBeEmptyDOMElement();
    expect(screen.getByTestId('build-date')).toHaveAttribute('dateTime');
    expect(screen.getByRole('heading', { name: /Étape 1 –/ })).toBeVisible();
  });

  it('étape 2 : liste les registres et normalise un prénom en direct', async () => {
    await renderDev();
    expect(screen.getByTestId('registry-source')).toHaveTextContent('insee');
    expect(screen.getByTestId('registry-champ calculé')).toHaveTextContent('femaleShare');
    expect(screen.getByTestId('registry-filtre')).toHaveTextContent('textSearch');
    expect(screen.getByTestId('registry-tri')).toHaveTextContent('alphabetical');
    fireEvent.change(screen.getByLabelText('Prénom à normaliser'), {
      target: { value: ' ÉLODIE  Noël ' },
    });
    expect(screen.getByTestId('normalized')).toHaveTextContent('[elodie noel]');
  });

  it('réagit au changement de hash', async () => {
    render(<App />);
    expect(screen.getByRole('searchbox', { name: 'Rechercher un prénom' })).toBeInTheDocument();
    await act(async () => {
      window.location.hash = '#/dev';
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    });
    expect(await screen.findByText('Page de diagnostic')).toBeVisible();
  });

  it('étape 2 : liste les registres et normalise un prénom en direct', async () => {
    await renderDev();
    expect(screen.getByTestId('registry-source')).toHaveTextContent('insee');
    expect(screen.getByTestId('registry-champ calculé')).toHaveTextContent('femaleShare');
    expect(screen.getByTestId('registry-filtre')).toHaveTextContent('textSearch');
    expect(screen.getByTestId('registry-tri')).toHaveTextContent('alphabetical');
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
    expect(await screen.findByText('Page de diagnostic')).toBeVisible();
  });

  it('étape 3 : affiche les statistiques du rapport INSEE', async () => {
    await renderDev();
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
    await renderDev();
    expect(await screen.findByRole('alert')).toHaveTextContent('HTTP 404');
  });

  it('étape 4 : charge les prénoms au démarrage et les affiche', async () => {
    await renderDev();
    await screen.findByText('Échantillon de 3 prénoms');
    expect(screen.getByTestId('load-status')).toHaveTextContent('3 prénoms chargés');
    expect(screen.getByTestId('origin-insee')).toHaveTextContent('réseau');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(screen.getByText(/"femaleShare":0.769/)).toBeInTheDocument();
  });

  it('étape 5 : recherche insensible aux accents, avec trois modes', async () => {
    await renderDev();
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
    fireEvent.click(within(screen.getByTestId('raw-search')).getByLabelText('Contient'));
    expect(results).toHaveTextContent('Jean-Baptiste');
    fireEvent.change(input, { target: { value: 'LLE' } });
    fireEvent.click(within(screen.getByTestId('raw-search')).getByLabelText('Finit par'));
    expect(results).toHaveTextContent('Camille');
  });

  it('étape 6 : chaque filtre a son contrôle et met à jour le nombre de résultats', async () => {
    await renderDev();
    await screen.findByText('Échantillon de 3 prénoms');
    const summary = screen.getByTestId('filters-summary');
    expect(summary).toHaveTextContent('3 résultats sur 3 · 0 filtre actif');
    for (const group of ['Texte', 'Popularité', 'Chronologie', 'Forme']) {
      expect(screen.getByRole('region', { name: `Groupe ${group}` })).toBeInTheDocument();
    }
    expect(screen.getAllByTestId(/^filter-[a-zA-Z]+$/)).toHaveLength(filters.all().length);

    const gender = within(screen.getByTestId('filter-gender'));
    fireEvent.click(gender.getByLabelText('Filles'));
    expect(summary).toHaveTextContent('1 résultat sur 3 · 1 filtre actif');
    expect(screen.getByTestId('filter-count-gender')).toHaveTextContent('seul : 1 · URL f');

    fireEvent.click(gender.getByLabelText('Tous'));
    fireEvent.click(within(screen.getByTestId('filter-accents')).getByLabelText('Sans accent'));
    expect(summary).toHaveTextContent('2 résultats sur 3 · 1 filtre actif');
    fireEvent.click(
      within(screen.getByTestId('filter-compound')).getByLabelText('Composés uniquement'),
    );
    expect(summary).toHaveTextContent('1 résultat sur 3 · 2 filtres actifs');
    expect(screen.getByTestId('filters-preview')).toHaveTextContent('Jean-Baptiste');

    fireEvent.click(screen.getByRole('button', { name: 'Tout réinitialiser' }));
    expect(summary).toHaveTextContent('3 résultats sur 3 · 0 filtre actif');
  });

  it('étape 7 : sélecteur de tri et de sens', async () => {
    await renderDev();
    await screen.findByText('Échantillon de 3 prénoms');
    const names = () =>
      within(screen.getByTestId('sort-results'))
        .getAllByRole('rowheader')
        .map((cell) => cell.textContent);
    const select = screen.getByLabelText('Trier par');
    expect(within(select).getAllByRole('option')).toHaveLength(sorts.all().length);

    expect(names()).toEqual(['Camille', 'Jean-Baptiste', 'Léa']);
    fireEvent.click(screen.getByLabelText('Décroissant'));
    expect(names()).toEqual(['Léa', 'Jean-Baptiste', 'Camille']);
    fireEvent.change(select, { target: { value: 'totalPopularity' } });
    expect(names()).toEqual(['Camille', 'Léa', 'Jean-Baptiste']);
    fireEvent.click(screen.getByLabelText('Croissant'));
    expect(names()).toEqual(['Jean-Baptiste', 'Léa', 'Camille']);
  });

  it('étape 8 : indique la mise en page et propose des fiches d’exemple', async () => {
    await renderDev();
    await screen.findByText('Échantillon de 3 prénoms');
    expect(screen.getByTestId('layout-mode')).toHaveTextContent('téléphone');
    expect(screen.getByRole('link', { name: 'Camille' })).toHaveAttribute(
      'href',
      '#/prenom/camille',
    );
    expect(screen.getByRole('link', { name: 'Jean-Baptiste' })).toHaveAttribute(
      'href',
      '#/prenom/jean-baptiste',
    );
  });

  it('étape 9 : réglages de mouvement et notification d’exemple', async () => {
    await renderDev();
    expect(screen.getByTestId('motion-Animations')).toHaveTextContent('complètes');
    fireEvent.click(screen.getByLabelText('Réduire les animations'));
    expect(screen.getByTestId('motion-Animations')).toHaveTextContent('réduites');
    fireEvent.click(screen.getByLabelText('Réduire les animations'));
    fireEvent.click(screen.getByRole('button', { name: 'Afficher une notification' }));
    expect(await screen.findByText('Exemple de notification')).toBeInTheDocument();
  });

  it('étape 10 : affiche le lien de la vue en cours, les favoris et l’export', async () => {
    await renderDev();
    await screen.findByText('Échantillon de 3 prénoms');
    expect(screen.getByTestId('current-href')).toHaveAttribute('href', '#/');
    expect(screen.getByTestId('favorites-count')).toHaveTextContent('0 favori');
    expect(screen.getByRole('link', { name: 'Favoris uniquement' })).toHaveAttribute(
      'href',
      '#/?f.favorites=only',
    );
    expect(screen.getByRole('button', { name: 'Exporter' })).toBeEnabled();
  });

  it('étape 11 : mesure le temps de réponse sur l’appareil', async () => {
    await renderDev();
    await screen.findByText('Échantillon de 3 prénoms');
    expect(screen.getByTestId('perf-load')).toHaveTextContent(/\d+ ms \(par le réseau\)/);
    fireEvent.click(screen.getByRole('button', { name: 'Mesurer le temps de réponse' }));
    const table = within(screen.getByTestId('perf-measures'));
    expect(table.getAllByRole('row')).toHaveLength(7);
    expect(table.getByRole('row', { name: /Filtre filles/ })).toHaveTextContent('dans le budget');
  });
});
