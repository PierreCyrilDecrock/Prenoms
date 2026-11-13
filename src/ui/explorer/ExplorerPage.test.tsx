import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { sampleData } from '@/sources/insee/facts.test';
import { initialQuery, useQueryStore } from '@/state/queryStore';
import { App } from '@/ui/App';
import { niceMax } from './YearChart';

/*
 * Données d'essai (3 prénoms) : Camille 65 naissances (mixte), Léa 18 (filles),
 * Jean-Baptiste 15 (garçons). L'environnement de test se comporte comme un téléphone.
 */

const report = { meta: sampleData.meta, size: { raw: 1000, gzip: 500 } };
let failData = false;

const names = () =>
  within(screen.getByRole('list', { name: 'Résultats' }))
    .getAllByRole('link')
    .map((link) => link.querySelector('span > span')?.textContent);

async function renderApp(hash = '') {
  window.location.hash = hash;
  render(<App />);
  if (hash === '') await screen.findByRole('list', { name: 'Résultats' });
}

async function go(hash: string) {
  await act(async () => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  });
}

beforeEach(() => {
  failData = false;
  useQueryStore.setState(initialQuery);
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      if (url.includes('insee.report.json')) return new Response(JSON.stringify(report));
      if (failData) return new Response('', { status: 503 });
      return new Response(JSON.stringify(sampleData));
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.location.hash = '';
});

describe('page principale', () => {
  it('affiche les prénoms triés par popularité, avec total, répartition et lien vers la fiche', async () => {
    await renderApp();
    expect(names()).toEqual(['Camille', 'Léa', 'Jean-Baptiste']);
    expect(screen.getByTestId('result-count')).toHaveTextContent('3 prénoms');

    const camille = screen.getByRole('link', { name: /Camille/ });
    expect(camille).toHaveAttribute('href', '#/prenom/camille');
    expect(camille).toHaveTextContent('65');
    expect(camille).toHaveTextContent('77 % filles');
    expect(screen.getByRole('link', { name: /Léa/ })).toHaveTextContent('Filles');
    expect(screen.getByRole('link', { name: /Jean-Baptiste/ })).toHaveTextContent('Garçons');
    expect(camille.querySelector('svg path')?.getAttribute('d')).toMatch(/^M0/);
  });

  it('filtre en direct et surligne le texte recherché', async () => {
    await renderApp();
    const input = screen.getByRole('searchbox', { name: 'Rechercher un prénom' });
    fireEvent.change(input, { target: { value: 'LE' } });
    expect(names()).toEqual(['Léa']);
    expect(screen.getByTestId('result-count')).toHaveTextContent('1 prénom');
    expect(screen.getByRole('link', { name: /Léa/ }).querySelector('mark')).toHaveTextContent('Lé');

    fireEvent.change(screen.getByLabelText('Mode de recherche'), { target: { value: 'contains' } });
    fireEvent.change(input, { target: { value: 'a' } });
    expect(names()).toEqual(['Camille', 'Léa', 'Jean-Baptiste']);
  });

  it('raccourcis : « / » place le curseur dans la recherche, « Échap » l’efface', async () => {
    await renderApp();
    const input = screen.getByRole('searchbox', { name: 'Rechercher un prénom' });
    expect(input).not.toHaveFocus();
    fireEvent.keyDown(document.body, { key: '/' });
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: 'lea' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(input).toHaveValue('');
    expect(names()).toHaveLength(3);
  });

  it('change de tri et de sens depuis le registre', async () => {
    await renderApp();
    const select = screen.getByLabelText('Trier par');
    expect(select).toHaveValue('totalPopularity');
    fireEvent.change(select, { target: { value: 'alphabetical' } });
    expect(names()).toEqual(['Léa', 'Jean-Baptiste', 'Camille']);
    fireEvent.click(screen.getByRole('button', { name: /Sens du tri : décroissant/ }));
    expect(names()).toEqual(['Camille', 'Jean-Baptiste', 'Léa']);
    expect(screen.getByRole('button', { name: /Sens du tri : croissant/ })).toBeInTheDocument();
  });

  it('tiroir de filtres : ouverture, filtre, pastille, fermeture', async () => {
    await renderApp();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const open = screen.getByRole('button', { name: 'Filtres' });
    fireEvent.click(open);

    const drawer = within(screen.getByRole('dialog', { name: 'Filtres' }));
    for (const group of ['Texte', 'Popularité', 'Chronologie', 'Forme']) {
      expect(drawer.getByRole('region', { name: group })).toBeInTheDocument();
    }
    expect(drawer.getByRole('button', { name: 'Fermer' })).toHaveFocus();

    fireEvent.click(
      within(drawer.getByRole('group', { name: 'Prénom composé' })).getByLabelText(
        'Sans les composés',
      ),
    );
    expect(drawer.getByRole('button', { name: 'Voir 2 prénoms' })).toBeInTheDocument();
    fireEvent.click(
      within(drawer.getByRole('group', { name: 'Sexe et mixité' })).getByLabelText('Filles'),
    );
    fireEvent.click(drawer.getByRole('button', { name: 'Voir 1 prénom' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(names()).toEqual(['Léa']);
    expect(screen.getByRole('button', { name: /Filtres/ })).toHaveTextContent('2');
    const chips = within(screen.getByRole('list', { name: 'Filtres actifs' }));
    expect(
      chips.getByRole('button', { name: 'Retirer le filtre Sexe et mixité : filles' }),
    ).toBeInTheDocument();

    fireEvent.click(
      chips.getByRole('button', { name: 'Retirer le filtre Prénom composé : exclus' }),
    );
    expect(names()).toEqual(['Léa']);
    expect(screen.getByRole('button', { name: /Filtres/ })).toHaveTextContent('1');
    fireEvent.click(screen.getByRole('button', { name: 'Tout réinitialiser' }));
    expect(names()).toHaveLength(3);
    expect(screen.queryByRole('list', { name: 'Filtres actifs' })).not.toBeInTheDocument();
  });

  it('le tiroir se ferme avec Échap et permet d’effacer un filtre', async () => {
    await renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Filtres' }));
    const drawer = within(screen.getByRole('dialog'));
    fireEvent.click(
      within(drawer.getAllByRole('group', { name: 'Accents' })[0]!).getByLabelText('Avec accent'),
    );
    fireEvent.click(drawer.getByRole('button', { name: 'Effacer le filtre Accents' }));
    expect(drawer.getByRole('button', { name: 'Voir 3 prénoms' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('aucun résultat : suggestion et réinitialisation', async () => {
    await renderApp();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz' } });
    expect(screen.getByRole('heading', { name: 'Aucun prénom ne correspond' })).toBeInTheDocument();
    expect(screen.getByText(/retirez un filtre/)).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole('main')).getAllByRole('button', { name: 'Tout réinitialiser' })[0]!,
    );
    expect(names()).toHaveLength(3);
  });

  it('chargement puis erreur, avec un bouton pour réessayer', async () => {
    failData = true;
    window.location.hash = '';
    render(<App />);
    expect(screen.getByRole('status', { name: 'Chargement des prénoms' })).toBeInTheDocument();
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Les prénoms n’ont pas pu être chargés');
    expect(alert).toHaveTextContent('HTTP 503');
    failData = false;
    fireEvent.click(within(alert).getByRole('button', { name: 'Réessayer' }));
    await screen.findByRole('list', { name: 'Résultats' });
    expect(names()).toHaveLength(3);
  });

  it('pied de page : lien discret vers le diagnostic', async () => {
    await renderApp();
    expect(screen.getByRole('link', { name: 'Diagnostic' })).toHaveAttribute('href', '#/dev');
  });
});

describe('fiche d’un prénom', () => {
  it('affiche la courbe par sexe, le pic, les années et la répartition', async () => {
    await renderApp();
    await go('#/prenom/camille');
    expect(screen.getByRole('heading', { level: 1, name: 'Camille' })).toBeInTheDocument();
    expect(screen.getByText('65 naissances de 1900 à 1902')).toBeInTheDocument();
    expect(
      screen.getByRole('img', {
        name: /Naissances par année du prénom Camille.*Pic en 1902 avec 35/,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('Filles (trait plein)')).toBeInTheDocument();
    expect(screen.getByText('Garçons (pointillés)')).toBeInTheDocument();
    expect(screen.getByText('77 % filles · 23 % garçons')).toBeInTheDocument();
    expect(screen.getByText('50 filles · 15 garçons')).toBeInTheDocument();
    const facts = within(screen.getByRole('region', { name: 'Repères' }));
    expect(facts.getByText('Pic').nextElementSibling).toHaveTextContent('1902');
    expect(facts.getByText('Première année').nextElementSibling).toHaveTextContent('1900');
    expect(facts.getByText('Dernière année').nextElementSibling).toHaveTextContent('1902');
    expect(document.title).toBe('Camille – Explorateur de prénoms');
    expect(screen.getByRole('link', { name: '← Tous les prénoms' })).toHaveAttribute('href', '#/');
  });

  it('s’ouvre directement par son adresse, y compris avec un identifiant encodé', async () => {
    await renderApp('#/prenom/jean-baptiste');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Jean-Baptiste' }),
    ).toBeInTheDocument();
    await go(`#/prenom/${encodeURIComponent('léa')}`);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Prénom introuvable' }),
    ).toBeInTheDocument();
  });

  it('signale un prénom inconnu', async () => {
    await renderApp('#/prenom/inconnu');
    expect(await screen.findByRole('heading', { name: 'Prénom introuvable' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Revenir à la liste' })).toHaveAttribute('href', '#/');
  });
});

describe('niceMax', () => {
  it('arrondit l’échelle à une valeur ronde', () => {
    expect([3, 7, 18, 35, 480, 5200, 10000].map(niceMax)).toEqual([
      5, 10, 20, 50, 500, 10000, 10000,
    ]);
  });
});
