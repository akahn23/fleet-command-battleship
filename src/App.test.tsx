import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import App from './App';
import { createGame, formatCoord, getShip, shipCells, type Coord } from './engine';

const SEED = 7;

function cell(board: 'player-board' | 'enemy-board', { row, col }: Coord) {
  const el = screen
    .getByTestId(board)
    .querySelector<HTMLButtonElement>(`[data-row="${row}"][data-col="${col}"]`);
  if (!el) throw new Error(`no cell ${row},${col}`);
  return el;
}

const headline = () => screen.getByTestId('turn-headline').textContent ?? '';
const startButton = () => screen.getByRole('button', { name: 'Start Battle' });

function renderGame(computerDelayMs = 0) {
  render(<App seed={SEED} computerDelayMs={computerDelayMs} />);
}

function autoPlaceAndStart() {
  fireEvent.click(screen.getByRole('button', { name: 'Auto-Place Fleet' }));
  fireEvent.click(startButton());
}

async function fireAt(coord: Coord) {
  fireEvent.click(cell('enemy-board', coord));
  await waitFor(() => expect(headline()).toMatch(/your turn|victory|defeat/i));
}

describe('App: placement', () => {
  it('opens on fleet placement under the RAVENFJORD title with Start Battle locked', () => {
    renderGame();
    expect(screen.getByRole('heading', { level: 1, name: /ravenfjord/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Muster Your Fleet' })).toBeInTheDocument();
    expect(startButton()).toBeDisabled();
    expect(screen.queryByTestId('enemy-board')).not.toBeInTheDocument();
  });

  it('places the selected ship horizontally, then auto-selects the next one', () => {
    renderGame();
    fireEvent.click(cell('player-board', { row: 0, col: 0 }));
    const ship = screen.getByTestId('ship-greatLongship');
    expect(ship.style.gridRow).toBe('2 / span 1');
    expect(ship.style.gridColumn).toBe('2 / span 5');
    expect(screen.getByRole('button', { name: /Dragonship/, pressed: true })).toBeInTheDocument();
  });

  it('rotates with the button and with the R key', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: /Rotate Ship/ }));
    fireEvent.click(cell('player-board', { row: 0, col: 0 }));
    expect(screen.getByTestId('ship-greatLongship').style.gridRow).toBe('2 / span 5');

    fireEvent.keyDown(window, { key: 'r' });
    fireEvent.click(cell('player-board', { row: 9, col: 1 }));
    expect(screen.getByTestId('ship-dragonship').style.gridColumn).toBe('3 / span 4');
  });

  it('rejects a ship that would run off the edge, with a reason, and places nothing', () => {
    renderGame();
    fireEvent.click(cell('player-board', { row: 0, col: 6 }));
    expect(screen.queryByTestId('ship-greatLongship')).not.toBeInTheDocument();
    expect(screen.getByText(/run aground/i)).toBeInTheDocument();
  });

  it('rejects an overlapping ship but allows touching ships', () => {
    renderGame();
    fireEvent.click(cell('player-board', { row: 0, col: 0 }));
    fireEvent.keyDown(window, { key: 'r' });
    fireEvent.click(cell('player-board', { row: 1, col: 2 }));
    expect(screen.getByTestId('ship-dragonship')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /War Longship/ }));
    fireEvent.keyDown(window, { key: 'r' });
    fireEvent.click(cell('player-board', { row: 2, col: 0 }));
    expect(screen.queryByTestId('ship-warLongship')).not.toBeInTheDocument();
    expect(screen.getByText(/collide with your Dragonship/i)).toBeInTheDocument();

    fireEvent.click(cell('player-board', { row: 1, col: 3 }));
    expect(screen.getByTestId('ship-warLongship')).toBeInTheDocument();
  });

  it('lifts a moored ship back to harbour when it is clicked', () => {
    renderGame();
    fireEvent.click(cell('player-board', { row: 4, col: 4 }));
    fireEvent.click(cell('player-board', { row: 4, col: 6 }));
    expect(screen.queryByTestId('ship-greatLongship')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Great Longship/, pressed: true }),
    ).toBeInTheDocument();
  });

  it('auto-places a full fleet, unlocks Start Battle, and Clear Fleet empties it again', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'Auto-Place Fleet' }));
    expect(within(screen.getByTestId('player-board')).getAllByTestId(/^ship-/)).toHaveLength(5);
    expect(startButton()).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Clear Fleet' }));
    expect(within(screen.getByTestId('player-board')).queryAllByTestId(/^ship-/)).toHaveLength(0);
    expect(startButton()).toBeDisabled();
  });
});

describe('App: battle', () => {
  it('hides every enemy ship until it is sunk', () => {
    renderGame();
    autoPlaceAndStart();
    expect(within(screen.getByTestId('enemy-board')).queryAllByTestId(/^ship-/)).toHaveLength(0);
    expect(headline()).toMatch(/your turn/i);
  });

  it('shows distinct player and enemy turn states in the live banner', async () => {
    renderGame(500);
    autoPlaceAndStart();
    const banner = screen.getByRole('status');
    expect(banner).toHaveClass('turn-banner--player');
    expect(banner).toHaveAttribute('aria-live', 'polite');

    fireEvent.click(cell('enemy-board', { row: 0, col: 0 }));
    await waitFor(() => expect(banner).toHaveClass('turn-banner--enemy'));
    expect(headline()).toBe('The enemy takes aim…');
  });

  it('keeps enemy ship classes and per-ship damage hidden until a sink', async () => {
    renderGame();
    autoPlaceAndStart();
    const target = createGame({ seed: SEED }).boards.computer.ships[0]!;
    const coords = shipCells(target);
    const name = getShip(target.shipId).name;

    await fireAt(coords[0]!);
    const log = within(screen.getByRole('list', { name: 'Battle log' }));
    const firstHit = log
      .getAllByRole('listitem')
      .map((item) => item.textContent ?? '')
      .find((entry) => entry.startsWith(`Your volley struck true at ${formatCoord(coords[0]!)}!`));
    expect(firstHit).toBe(`Your volley struck true at ${formatCoord(coords[0]!)}!`);
    expect(firstHit).not.toContain(name);

    const enemyFleet = screen.getByRole('region', { name: 'Enemy Fleet' });
    const targetStatus = within(enemyFleet).getByTestId(`fleet-ship-${target.shipId}`);
    expect(targetStatus.querySelectorAll('.pip--hit')).toHaveLength(0);
    expect(targetStatus).toHaveTextContent('Afloat');
    expect(enemyFleet).toHaveTextContent('1 hit');

    for (const coord of coords.slice(1)) await fireAt(coord);
    const sinkEntry = `The enemy ${name} sinks to Rán's halls at ${formatCoord(coords.at(-1)!)}!`;
    expect(log.getAllByRole('listitem').map((item) => item.textContent)).toContain(sinkEntry);
    expect(targetStatus).toHaveTextContent('Sunk');
  });

  it('resolves a shot, then the computer answers once, and the turn returns', async () => {
    renderGame();
    autoPlaceAndStart();
    await fireAt({ row: 0, col: 0 });
    const log = screen.getByRole('list', { name: 'Battle log' });
    const entries = within(log)
      .getAllByRole('listitem')
      .map((li) => li.textContent);
    expect(entries).toHaveLength(3);
    expect(entries[0]).toMatch(/^The enemy's (?:volley|spear)|^Your .* sinks to Rán's halls/);
    expect(entries[1]).toMatch(/A1/);
    expect(cell('enemy-board', { row: 0, col: 0 }).dataset.state).not.toBe('open');
    expect(
      screen.getByTestId('player-board').querySelectorAll('[data-testid="marker"]'),
    ).toHaveLength(1);
  });

  it('ignores a click on a square already fired upon: no new shot, no lost turn', async () => {
    renderGame();
    autoPlaceAndStart();
    await fireAt({ row: 3, col: 3 });
    const before = within(screen.getByRole('list', { name: 'Battle log' })).getAllByRole(
      'listitem',
    );
    fireEvent.click(cell('enemy-board', { row: 3, col: 3 }));
    await act(() => new Promise((r) => setTimeout(r, 20)));
    const after = within(screen.getByRole('list', { name: 'Battle log' })).getAllByRole('listitem');
    expect(after).toHaveLength(before.length);
    expect(headline()).toMatch(/your turn/i);
  });

  it('plays to victory, reveals sunk ships, and New Battle starts a fresh placement', async () => {
    renderGame();
    autoPlaceAndStart();
    const enemyShips = createGame({ seed: SEED }).boards.computer.ships;
    for (const coord of enemyShips.flatMap(shipCells)) await fireAt(coord);

    const dialog = screen.getByRole('dialog', { name: 'Valhalla Awaits' });
    expect(within(screen.getByTestId('enemy-board')).getAllByTestId(/^ship-/)).toHaveLength(5);
    expect(
      screen.getByText('The enemy fleet lies broken on the fjord. Skalds will sing of this day.'),
    ).toBeInTheDocument();
    expect(document.querySelector('main')).toHaveAttribute('inert');
    expect(document.activeElement).toHaveTextContent('New Battle');
    expect(document.activeElement?.closest('[role="dialog"]')).not.toBeNull();

    const enemyBoard = screen.getByTestId('enemy-board');
    const shots = enemyBoard.querySelectorAll(
      '[data-state="miss"], [data-state="hit"], [data-state="sunk"]',
    ).length;
    const hits = enemyBoard.querySelectorAll('[data-state="hit"], [data-state="sunk"]').length;
    const accuracy = Math.round((hits / shots) * 100);
    expect(within(dialog).getByTestId('stat-shots')).toHaveTextContent(String(shots));
    expect(within(dialog).getByTestId('stat-hits')).toHaveTextContent(String(hits));
    expect(within(dialog).getByTestId('stat-accuracy')).toHaveTextContent(`${accuracy}%`);
    expect(within(dialog).getByTestId('stat-enemy-sunk')).toHaveTextContent('5');
    expect(within(dialog).getByTestId('stat-ships-lost')).toHaveTextContent(
      String(screen.getByTestId('player-board').querySelectorAll('[data-variant="sunk"]').length),
    );

    fireEvent.click(screen.getByRole('button', { name: 'View Battlefield' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.querySelector('main')).not.toHaveAttribute('inert');
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'New Battle' }));

    fireEvent.click(screen.getByRole('button', { name: 'New Battle' }));
    expect(screen.getByRole('heading', { name: 'Muster Your Fleet' })).toBeInTheDocument();
    expect(within(screen.getByTestId('player-board')).queryAllByTestId(/^ship-/)).toHaveLength(0);
  });

  it('shows defeat copy and actual battle stats after firing only at known-empty enemy cells', async () => {
    renderGame();
    autoPlaceAndStart();
    const occupied = new Set(
      createGame({ seed: SEED })
        .boards.computer.ships.flatMap(shipCells)
        .map(({ row, col }) => `${row},${col}`),
    );
    const emptyCells = Array.from({ length: 100 }, (_, index) => ({
      row: Math.floor(index / 10),
      col: index % 10,
    })).filter(({ row, col }) => !occupied.has(`${row},${col}`));

    for (const coord of emptyCells) {
      await fireAt(coord);
      if (/defeat/i.test(headline())) break;
    }

    const dialog = screen.getByRole('dialog', { name: 'The Sea Claims Your Fleet' });
    const enemyBoard = screen.getByTestId('enemy-board');
    const shots = enemyBoard.querySelectorAll(
      '[data-state="miss"], [data-state="hit"], [data-state="sunk"]',
    ).length;
    const hits = enemyBoard.querySelectorAll('[data-state="hit"], [data-state="sunk"]').length;
    expect(within(dialog).getByTestId('stat-shots')).toHaveTextContent(String(shots));
    expect(within(dialog).getByTestId('stat-hits')).toHaveTextContent(String(hits));
    expect(within(dialog).getByTestId('stat-accuracy')).toHaveTextContent(
      `${Math.round((hits / shots) * 100)}%`,
    );
    expect(within(dialog).getByTestId('stat-enemy-sunk')).toHaveTextContent('0');
    expect(within(dialog).getByTestId('stat-ships-lost')).toHaveTextContent(
      String(screen.getByTestId('player-board').querySelectorAll('[data-variant="sunk"]').length),
    );
    expect(screen.getByText(/your longships rest beneath the waves/i)).toBeInTheDocument();
  }, 15_000);

  it('New Battle mid-fight asks first: Keep Fighting cancels, Abandon Battle restarts', async () => {
    renderGame();
    autoPlaceAndStart();
    await fireAt({ row: 5, col: 5 });

    fireEvent.click(screen.getByRole('button', { name: 'New Battle' }));
    expect(screen.getByRole('group', { name: 'Abandon this battle?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Keep Fighting' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'New Battle' }));
    expect(screen.getByRole('list', { name: 'Battle log' })).toBeInTheDocument();
    expect(cell('enemy-board', { row: 5, col: 5 }).dataset.state).not.toBe('open');

    fireEvent.click(screen.getByRole('button', { name: 'New Battle' }));
    fireEvent.click(screen.getByRole('button', { name: 'Abandon Battle' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'New Battle' }));
    expect(screen.getByRole('heading', { name: 'Muster Your Fleet' })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Battle log' })).not.toBeInTheDocument();
  });

  it('New Battle during placement restarts immediately, without asking', () => {
    renderGame();
    fireEvent.click(screen.getByRole('button', { name: 'Auto-Place Fleet' }));
    fireEvent.click(screen.getByRole('button', { name: 'New Battle' }));
    expect(screen.queryByRole('group', { name: 'Abandon this battle?' })).not.toBeInTheDocument();
    expect(within(screen.getByTestId('player-board')).queryAllByTestId(/^ship-/)).toHaveLength(0);
  });
});
