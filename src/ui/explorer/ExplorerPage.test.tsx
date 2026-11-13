import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { sampleData } from '@/sources/insee/facts.test';
import { FAVORITES_KEY, useFavoritesStore } from '@/state/favoritesStore';
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
  window.history.replaceState(null, '', '#/');
  useQueryStore.setState(initialQuery);
  useFavoritesStore.getState().clear();
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
    await waitFor(() => expect(names()).toEqual(['Camille', 'Léa', 'Jean-Baptiste']));
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
    await waitFor(() => expect(names()).toEqual(['Léa']));
    expect(screen.getByTestId('result-count')).toHaveTextContent('1 prénom');
    expect(screen.getByRole('link', { name: /Léa/ }).querySelector('mark')).toHaveTextContent('Lé');

    fireEvent.change(screen.getByLabelText('Mode de recherche'), { target: { value: 'contains' } });
    fireEvent.change(input, { target: { value: 'a' } });
    await waitFor(() => expect(names()).toEqual(['Camille', 'Léa', 'Jean-Baptiste']));
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
    await waitFor(() => expect(names()).toHaveLength(3));
  });

  it('change de tri et de sens depuis le registre', async () => {
    await renderApp();
    const select = screen.getByLabelText('Trier par');
    expect(select).toHaveValue('totalPopularity');
    fireEvent.change(select, { target: { value: 'alphabetical' } });
    await waitFor(() => expect(names()).toEqual(['Léa', 'Jean-Baptiste', 'Camille']));
    fireEvent.click(screen.getByRole('button', { name: /Sens du tri : décroissant/ }));
    await waitFor(() => expect(names()).toEqual(['Camille', 'Jean-Baptiste', 'Léa']));
    expect(screen.getByRole('button', { name: /Sens du tri : croissant/ })).toBeInTheDocument();
  });

  it('tiroir de filtres : ouverture, filtre, pastille, fermeture', async () => {
    await renderApp();
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
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

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(names()).toEqual(['Léa']));
    expect(screen.getByRole('button', { name: /Filtres/ })).toHaveTextContent('2');
    const chips = within(screen.getByRole('list', { name: 'Filtres actifs' }));
    expect(
      chips.getByRole('button', { name: 'Retirer le filtre Sexe et mixité : filles' }),
    ).toBeInTheDocument();

    fireEvent.click(
      chips.getByRole('button', { name: 'Retirer le filtre Prénom composé : exclus' }),
    );
    await waitFor(() => expect(names()).toEqual(['Léa']));
    expect(screen.getByRole('button', { name: /Filtres/ })).toHaveTextContent('1');
    fireEvent.click(screen.getByRole('button', { name: 'Tout réinitialiser' }));
    await waitFor(() => expect(names()).toHaveLength(3));
    await waitFor(() =>
      expect(
        within(screen.getByRole('list', { name: 'Filtres actifs' })).queryAllByRole('button'),
      ).toHaveLength(0),
    );
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
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('aucun résultat : suggestion et réinitialisation', async () => {
    await renderApp();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'zzz' } });
    expect(screen.getByRole('heading', { name: 'Aucun prénom ne correspond' })).toBeInTheDocument();
    expect(screen.getByText(/retirez un filtre/)).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByRole('main')).getAllByRole('button', { name: 'Tout réinitialiser' })[0]!,
    );
    await waitFor(() => expect(names()).toHaveLength(3));
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
    await waitFor(() => expect(names()).toHaveLength(3));
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

describe('animations et interactions', () => {
  it('cœur des favoris : bascule sur la ligne et se retrouve sur la fiche', async () => {
    await renderApp();
    const add = screen.getByRole('button', { name: 'Ajouter Léa aux favoris' });
    expect(add).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(add);
    expect(screen.getByRole('button', { name: 'Retirer Léa des favoris' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await go('#/prenom/lea');
    fireEvent.click(screen.getByRole('button', { name: 'Retirer Léa des favoris' }));
    expect(screen.getByRole('button', { name: 'Ajouter Léa aux favoris' })).toBeInTheDocument();
  });

  it('copier un prénom affiche une notification discrète', async () => {
    const writeText = vi.fn(async () => undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    await renderApp('#/prenom/camille');
    fireEvent.click(await screen.findByRole('button', { name: 'Copier le prénom' }));
    expect(writeText).toHaveBeenCalledWith('Camille');
    expect(await screen.findByText('« Camille » copié')).toBeInTheDocument();
  });

  it('réglage « Réduire les animations » : appliqué à la page et conservé', async () => {
    await renderApp();
    const checkbox = screen.getByLabelText('Réduire les animations');
    expect(checkbox).not.toBeChecked();
    expect(document.documentElement.dataset.reduceMotion).toBe('false');
    fireEvent.click(checkbox);
    expect(document.documentElement.dataset.reduceMotion).toBe('true');
    expect(JSON.parse(localStorage.getItem('prenoms:settings')!)).toMatchObject({
      reduceMotion: true,
    });
    fireEvent.click(checkbox);
    expect(document.documentElement.dataset.reduceMotion).toBe('false');
  });

  it('retour tactile : vibre sur une action principale, sauf si désactivé', async () => {
    const vibrate = vi.fn();
    vi.stubGlobal('navigator', { ...navigator, vibrate });
    await renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter Léa aux favoris' }));
    expect(vibrate).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText('Retour tactile (vibration)'));
    fireEvent.click(screen.getByRole('button', { name: 'Retirer Léa des favoris' }));
    expect(vibrate).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByLabelText('Retour tactile (vibration)'));
  });

  it('la ligne ouverte et le titre de la fiche partagent le même nom de transition', async () => {
    await renderApp();
    fireEvent.click(screen.getByRole('link', { name: /Camille/ }));
    await go('#/prenom/camille');
    const title = screen.getByRole('heading', { level: 1, name: 'Camille' });
    expect(title.querySelector('span')?.style.viewTransitionName).toBe('name-title');
  });
});

describe('état dans l’URL', () => {
  it('un lien restaure exactement la même vue', async () => {
    await renderApp();
    cleanup();
    useQueryStore.setState(initialQuery);
    window.history.replaceState(null, '', '#/?q=a&m=c&f.compound=exclude&s=alphabetical&d=desc');
    render(<App />);
    await screen.findByRole('list', { name: 'Résultats' });

    await waitFor(() => expect(names()).toEqual(['Léa', 'Camille']));
    expect(screen.getByRole('searchbox')).toHaveValue('a');
    expect(screen.getByLabelText('Mode de recherche')).toHaveValue('contains');
    expect(screen.getByLabelText('Trier par')).toHaveValue('alphabetical');
    expect(screen.getByRole('button', { name: /Sens du tri : décroissant/ })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Retirer le filtre Prénom composé : exclus' }),
    ).toBeInTheDocument();
  });

  it('ignore un paramètre invalide et remet l’URL au propre', async () => {
    window.history.replaceState(null, '', '#/?q=le&f.gender=zzz&f.inconnu=1&s=nimporte&m=x');
    render(<App />);
    await screen.findByRole('list', { name: 'Résultats' });
    await waitFor(() => expect(names()).toEqual(['Léa']));
    expect(screen.getByLabelText('Trier par')).toHaveValue('totalPopularity');
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'lea' } });
    expect(window.location.hash).toBe('#/?q=lea');
  });

  it('écrit l’état dans l’URL : replaceState pour une frappe, pushState pour un changement discret', async () => {
    await renderApp();
    const push = vi.spyOn(window.history, 'pushState');
    const replace = vi.spyOn(window.history, 'replaceState');

    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'l' } });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'lé' } });
    expect(window.location.hash).toBe('#/?q=l%C3%A9');
    expect(replace).toHaveBeenCalledTimes(2);
    expect(push).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Trier par'), { target: { value: 'length' } });
    expect(window.location.hash).toBe('#/?q=l%C3%A9&s=length&d=desc');
    expect(push).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Filtres' }));
    const drawer = within(screen.getByRole('dialog'));
    fireEvent.click(
      within(drawer.getByRole('group', { name: 'Sexe et mixité' })).getByLabelText('Filles'),
    );
    expect(window.location.hash).toBe('#/?q=l%C3%A9&f.gender=f&s=length&d=desc');
    expect(push).toHaveBeenCalledTimes(2);

    fireEvent.click(drawer.getByRole('button', { name: 'Réinitialiser' }));
    expect(window.location.hash).toBe('#/?s=length&d=desc');
    push.mockRestore();
    replace.mockRestore();
  });

  it('le retour arrière restaure la vue précédente', async () => {
    await renderApp();
    fireEvent.change(screen.getByLabelText('Trier par'), { target: { value: 'alphabetical' } });
    await waitFor(() => expect(names()).toEqual(['Léa', 'Jean-Baptiste', 'Camille']));
    // Simule le bouton « Précédent » du navigateur.
    await act(async () => {
      window.history.replaceState(null, '', '#/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    await waitFor(() => expect(names()).toEqual(['Camille', 'Léa', 'Jean-Baptiste']));
    expect(screen.getByLabelText('Trier par')).toHaveValue('totalPopularity');
  });

  it('la fiche renvoie vers la liste avec la vue en cours', async () => {
    await renderApp();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'ca' } });
    await go('#/prenom/camille');
    const back = screen.getByRole('link', { name: '← Tous les prénoms' });
    expect(back).toHaveAttribute('href', '#/?q=ca');
    await go('#/?q=ca');
    await waitFor(() => expect(names()).toEqual(['Camille']));
    expect(screen.getByRole('searchbox')).toHaveValue('ca');
  });
});

describe('favoris et export', () => {
  it('les favoris sont conservés et alimentent le filtre « Favoris uniquement »', async () => {
    await renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter Léa aux favoris' }));
    expect(JSON.parse(localStorage.getItem(FAVORITES_KEY)!)).toEqual(['lea']);

    fireEvent.click(screen.getByRole('button', { name: 'Filtres' }));
    const drawer = within(screen.getByRole('dialog'));
    fireEvent.click(
      within(drawer.getByRole('group', { name: 'Favoris' })).getByLabelText('Favoris uniquement'),
    );
    fireEvent.click(drawer.getByRole('button', { name: 'Voir 1 prénom' }));
    await waitFor(() => expect(names()).toEqual(['Léa']));
    expect(window.location.hash).toBe('#/?f.favorites=only');

    // Retirer le favori le fait sortir de la liste filtrée.
    fireEvent.click(screen.getByRole('button', { name: 'Retirer Léa des favoris' }));
    expect(
      await screen.findByRole('heading', { name: 'Aucun prénom ne correspond' }),
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(FAVORITES_KEY)!)).toEqual([]);
  });

  it('exporte la liste filtrée et triée en CSV et en JSON', async () => {
    const blobs: Blob[] = [];
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: (blob: Blob) => (blobs.push(blob), 'blob:test'),
      revokeObjectURL: vi.fn(),
    });
    const clicked: string[] = [];
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push(this.download);
    });

    await renderApp();
    fireEvent.change(screen.getByLabelText('Trier par'), { target: { value: 'alphabetical' } });
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'l' } });
    fireEvent.click(screen.getByRole('button', { name: 'Exporter' }));
    fireEvent.click(
      within(screen.getByRole('group', { name: 'Format d’export' })).getByRole('button', {
        name: /CSV/,
      }),
    );

    expect(clicked[0]).toMatch(/^prenoms-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(blobs[0]!.type).toBe('text/csv;charset=utf-8');
    const csv = await blobs[0]!.text();
    const lines = csv.split('\r\n');
    expect(lines[0]).toContain('id;prenom;derived.');
    expect(lines[0]).toContain('insee.total');
    expect(lines[1]).toMatch(/^lea;Léa;/);
    expect(lines).toHaveLength(3);
    expect(await screen.findByText('1 prénom exporté en CSV')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Exporter' }));
    fireEvent.click(screen.getByRole('button', { name: /JSON/ }));
    expect(clicked[1]).toMatch(/\.json$/);
    const json = JSON.parse(await blobs[1]!.text()) as {
      id: string;
      facts: { insee: { byYear: unknown } };
    }[];
    expect(json.map((item) => item.id)).toEqual(['lea']);
    expect(json[0]!.facts.insee.byYear).toBeDefined();
    click.mockRestore();
  });
});

describe('niceMax', () => {
  it('arrondit l’échelle à une valeur ronde', () => {
    expect([3, 7, 18, 35, 480, 5200, 10000].map(niceMax)).toEqual([
      5, 10, 20, 50, 500, 10000, 10000,
    ]);
  });
});
