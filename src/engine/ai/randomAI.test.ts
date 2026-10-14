import { createReducer } from '../game';
import { Rng } from '../rng';
import { battleState } from '../testUtils';
import type { GameState } from '../types';
import { randomAI, type TargetingStrategy } from './randomAI';
import { buildTargetingView, type CellKnowledge, type TargetingView } from './targetingView';

const viewWith = (fill: (row: number, col: number) => CellKnowledge): TargetingView => ({
  cells: Array.from({ length: 10 }, (_, r) => Array.from({ length: 10 }, (_, c) => fill(r, c))),
  remainingShipLengths: [5, 4, 3, 3, 2],
});

describe('randomAI', () => {
  it('only targets squares it has not fired on', () => {
    const view = viewWith((r, c) => ((r + c) % 2 === 0 ? 'miss' : 'unknown'));
    const rng = new Rng(3);
    for (let i = 0; i < 500; i++) {
      const { row, col } = randomAI(view, rng);
      expect(view.cells[row]?.[col]).toBe('unknown');
    }
  });

  it('finds the last open square', () => {
    const view = viewWith((r, c) => (r === 6 && c === 4 ? 'unknown' : 'miss'));
    expect(randomAI(view, new Rng(1))).toEqual({ row: 6, col: 4 });
  });

  it('is deterministic for the same view and seed', () => {
    const view = viewWith(() => 'unknown');
    expect(randomAI(view, new Rng(10))).toEqual(randomAI(view, new Rng(10)));
  });

  it('covers all 100 squares in 100 shots without repeating', () => {
    const rng = new Rng(8);
    const cells = viewWith(() => 'unknown').cells.map((row) => [...row]);
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const { row, col } = randomAI({ cells, remainingShipLengths: [] }, rng);
      const key = `${row},${col}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      cells[row]![col] = 'miss';
    }
    expect(seen.size).toBe(100);
  });
});

describe('computer fairness', () => {
  it('the reducer hands the strategy only the TargetingView of the player board', () => {
    const calls: unknown[][] = [];
    const spy: TargetingStrategy = (view, rng) => {
      calls.push([view, rng]);
      return randomAI(view, rng);
    };
    const reducer = createReducer(spy);
    let state = battleState();
    state = reducer(state, { type: 'PLAYER_FIRE', coord: { row: 9, col: 9 } });
    const expectedView = buildTargetingView(state.boards.player);
    state = reducer(state, { type: 'COMPUTER_FIRE', gameId: state.gameId });

    expect(calls).toHaveLength(1);
    const [view, rng] = calls[0]!;
    expect(view).toEqual(expectedView);
    expect(rng).toBeInstanceOf(Rng);
    expect(JSON.stringify(view)).not.toMatch(/origin|shipId|orientation|ships/);
  });

  it('chooses the same move regardless of where the player’s ships are', () => {
    // Same seed + same (empty) shot history, but two different player fleets.
    const pick = (ships: GameState['boards']['player']['ships']) => {
      let state = battleState(ships);
      state = createReducer(randomAI)(state, { type: 'PLAYER_FIRE', coord: { row: 9, col: 9 } });
      state = createReducer(randomAI)(state, { type: 'COMPUTER_FIRE', gameId: state.gameId });
      return state.boards.player.shots[0]!.coord;
    };
    const rows = battleState().boards.player.ships;
    const cols = battleState().boards.computer.ships;
    expect(pick(rows)).toEqual(pick(cols));
  });
});
