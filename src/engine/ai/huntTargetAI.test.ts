import { isFleetDestroyed, receiveShot } from '../board';
import { createGame, createReducer } from '../game';
import { FLEET } from '../fleet';
import { Rng } from '../rng';
import { randomFleet } from '../placement';
import type { Board } from '../types';
import { huntTargetAI } from './huntTargetAI';
import { randomAI } from './randomAI';
import { buildTargetingView, type CellKnowledge, type TargetingView } from './targetingView';
import { ROW_FLEET, COLUMN_FLEET } from '../testUtils';

const viewWith = (
  overrides: readonly { row: number; col: number; state: CellKnowledge }[] = [],
  remainingShipLengths: number[] = [5, 4, 3, 3, 2],
): TargetingView => {
  const cells = Array.from({ length: 10 }, () =>
    Array.from({ length: 10 }, (): CellKnowledge => 'unknown'),
  );
  overrides.forEach(({ row, col, state }) => {
    cells[row]![col] = state;
  });
  return { cells, remainingShipLengths };
};

const choicesAcrossSeeds = (view: TargetingView, count = 100) =>
  Array.from({ length: count }, (_, seed) => huntTargetAI(view, new Rng(seed)));

const key = ({ row, col }: { row: number; col: number }) => `${row},${col}`;

describe('huntTargetAI', () => {
  it('hunts only parity cells for the shortest remaining ship', () => {
    const view = viewWith();
    const { row, col } = huntTargetAI(view, new Rng(10));
    expect((row + col) % 2).toBe(0);
    expect(view.cells[row]?.[col]).toBe('unknown');
  });

  it('targets an orthogonal neighbour of a single hit', () => {
    const view = viewWith([{ row: 4, col: 4, state: 'hit' }]);
    const neighbours = new Set(['3,4', '5,4', '4,3', '4,5']);
    choicesAcrossSeeds(view).forEach((coord) => expect(neighbours.has(key(coord))).toBe(true));
  });

  it('filters fired squares when targeting a corner hit', () => {
    const view = viewWith([
      { row: 0, col: 0, state: 'hit' },
      { row: 0, col: 1, state: 'miss' },
    ]);
    choicesAcrossSeeds(view).forEach((coord) => expect(coord).toEqual({ row: 1, col: 0 }));
  });

  it('follows a horizontal run instead of firing above or below it', () => {
    const view = viewWith([
      { row: 4, col: 4, state: 'hit' },
      { row: 4, col: 5, state: 'hit' },
    ]);
    const endpoints = new Set(['4,3', '4,6']);
    choicesAcrossSeeds(view).forEach((coord) => expect(endpoints.has(key(coord))).toBe(true));
  });

  it('continues along a run when one end is blocked', () => {
    const view = viewWith([
      { row: 4, col: 4, state: 'hit' },
      { row: 4, col: 5, state: 'hit' },
      { row: 4, col: 3, state: 'miss' },
    ]);
    choicesAcrossSeeds(view).forEach((coord) => expect(coord).toEqual({ row: 4, col: 6 }));
  });

  it('chooses the only continuation when a hit run reaches a board edge', () => {
    const vertical = viewWith([
      { row: 8, col: 4, state: 'hit' },
      { row: 9, col: 4, state: 'hit' },
    ]);
    const horizontal = viewWith([
      { row: 3, col: 8, state: 'hit' },
      { row: 3, col: 9, state: 'hit' },
    ]);

    choicesAcrossSeeds(vertical).forEach((coord) => expect(coord).toEqual({ row: 7, col: 4 }));
    choicesAcrossSeeds(horizontal).forEach((coord) => expect(coord).toEqual({ row: 3, col: 7 }));
  });

  it('falls back to adjacent cells when both ends of a run are blocked', () => {
    const view = viewWith([
      { row: 0, col: 0, state: 'hit' },
      { row: 0, col: 1, state: 'hit' },
      { row: 0, col: 2, state: 'miss' },
    ]);
    const neighbours = new Set(['1,0', '1,1']);
    choicesAcrossSeeds(view).forEach((coord) => expect(neighbours.has(key(coord))).toBe(true));
  });

  it('keeps targeting unresolved hits after another ship has sunk', () => {
    const view = viewWith(
      [
        { row: 0, col: 0, state: 'sunk' },
        { row: 0, col: 1, state: 'sunk' },
        { row: 8, col: 8, state: 'hit' },
      ],
      [4, 3, 3, 2],
    );
    const neighbours = new Set(['7,8', '9,8', '8,7', '8,9']);
    choicesAcrossSeeds(view).forEach((coord) => expect(neighbours.has(key(coord))).toBe(true));
  });

  it('falls back to any unknown cell when only non-parity cells remain', () => {
    const overrides: { row: number; col: number; state: CellKnowledge }[] = Array.from(
      { length: 100 },
      (_, index) => ({
        row: Math.floor(index / 10),
        col: index % 10,
        state: 'miss',
      }),
    );
    overrides[1]!.state = 'unknown';
    const view = viewWith(overrides, [2]);
    expect(huntTargetAI(view, new Rng(10))).toEqual({ row: 0, col: 1 });
  });

  it('never repeats, misses the board bounds, or stalls in 300 full games', () => {
    const reducer = createReducer(huntTargetAI);
    for (let seed = 0; seed < 300; seed++) {
      let state = createGame({ seed });
      state = reducer(state, { type: 'AUTO_PLACE' });
      state = reducer(state, { type: 'START_BATTLE' });
      const playerRng = new Rng(seed ^ 0xa5a5a5a5);
      const computerShots = new Set<string>();
      let turns = 0;

      while (state.phase === 'battle') {
        if (state.turn === 'player') {
          const alreadyFired = new Set(state.boards.computer.shots.map(({ coord }) => key(coord)));
          const open = Array.from({ length: 100 }, (_, index) => ({
            row: Math.floor(index / 10),
            col: index % 10,
          })).filter((coord) => !alreadyFired.has(key(coord)));
          const coord = playerRng.pick(open);
          state = reducer(state, { type: 'PLAYER_FIRE', coord });
        } else {
          const previousShotCount = state.boards.player.shots.length;
          state = reducer(state, { type: 'COMPUTER_FIRE', gameId: state.gameId });
          expect(state.boards.player.shots).toHaveLength(previousShotCount + 1);
          const coord = state.boards.player.shots.at(-1)!.coord;
          expect(coord.row).toBeGreaterThanOrEqual(0);
          expect(coord.row).toBeLessThan(10);
          expect(coord.col).toBeGreaterThanOrEqual(0);
          expect(coord.col).toBeLessThan(10);
          expect(computerShots.has(key(coord))).toBe(false);
          computerShots.add(key(coord));
        }
        turns++;
        expect(turns).toBeLessThanOrEqual(200);
      }

      expect(state.phase).toBe('gameOver');
    }
  }, 15000);

  it('sinks random fleets in fewer than 65 shots and beats randomAI on the same seeds', () => {
    const shotsToSink = (ships: Board['ships'], strategy: typeof huntTargetAI, seed: number) => {
      let board: Board = { ships, shots: [] };
      const rng = new Rng(seed ^ 0x5a5a5a5a);
      let shots = 0;
      while (!isFleetDestroyed(board)) {
        const target = strategy(buildTargetingView(board), rng);
        const outcome = receiveShot(board, target);
        if (!outcome) throw new Error(`Illegal target ${key(target)} for seed ${seed}`);
        board = outcome.board;
        shots++;
      }
      return shots;
    };

    const huntShots: number[] = [];
    const randomShots: number[] = [];
    for (let seed = 0; seed < 200; seed++) {
      const fleet = randomFleet(new Rng(seed));
      huntShots.push(shotsToSink(fleet, huntTargetAI, seed));
      randomShots.push(shotsToSink(fleet, randomAI, seed));
    }
    const huntMean = huntShots.reduce((sum, shots) => sum + shots, 0) / huntShots.length;
    const randomMean = randomShots.reduce((sum, shots) => sum + shots, 0) / randomShots.length;
    console.log(
      `Mean shots to sink fleet: huntTargetAI ${huntMean.toFixed(2)}, randomAI ${randomMean.toFixed(2)}`,
    );
    expect(huntMean).toBeLessThan(65);
    expect(huntMean).toBeLessThan(randomMean);
  });

  it('sinks a fleet of touching ships within 100 legal shots across 50 seeds', () => {
    const ships = FLEET.map(({ id }, row) => ({
      shipId: id,
      origin: { row, col: 0 },
      orientation: 'horizontal' as const,
    }));

    for (let seed = 0; seed < 50; seed++) {
      let board: Board = { ships, shots: [] };
      const rng = new Rng(seed);
      const targets = new Set<string>();
      let shots = 0;

      while (!isFleetDestroyed(board)) {
        const target = huntTargetAI(buildTargetingView(board), rng);
        const targetKey = key(target);
        expect(targets.has(targetKey)).toBe(false);
        const outcome = receiveShot(board, target);
        expect(outcome).not.toBeNull();
        if (!outcome) throw new Error(`Illegal target ${targetKey} for seed ${seed}`);
        targets.add(targetKey);
        board = outcome.board;
        shots++;
        expect(shots).toBeLessThanOrEqual(100);
      }
    }
  });

  it('makes identical choices from identical views despite different hidden fleets', () => {
    const shot = { row: 9, col: 9 };
    const rowBoard = receiveShot({ ships: ROW_FLEET, shots: [] }, shot)!.board;
    const columnBoard = receiveShot({ ships: COLUMN_FLEET, shots: [] }, shot)!.board;
    const rowView = buildTargetingView(rowBoard);
    const columnView = buildTargetingView(columnBoard);

    expect(rowBoard.ships).not.toEqual(columnBoard.ships);
    expect(rowBoard.shots).toEqual(columnBoard.shots);
    expect(rowView).toEqual(columnView);
    expect(huntTargetAI(rowView, new Rng(42))).toEqual(huntTargetAI(columnView, new Rng(42)));
  });
});
