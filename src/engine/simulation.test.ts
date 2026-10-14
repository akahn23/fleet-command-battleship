import { isFleetDestroyed } from './board';
import { isInBounds } from './coords';
import { FLEET } from './fleet';
import { createGame, gameReducer, type GameAction } from './game';
import { Rng } from './rng';
import type { Board, Coord, GameState, ShipId, ShipPlacement } from './types';

const key = ({ row, col }: Coord) => `${row},${col}`;

const allCells = Array.from({ length: 100 }, (_, index) => ({
  row: Math.floor(index / 10),
  col: index % 10,
}));

function assertFleetIsLegal(ships: ShipPlacement[]) {
  expect(ships).toHaveLength(FLEET.length);
  expect(new Set(ships.map(({ shipId }) => shipId)).size).toBe(FLEET.length);
  const occupied = new Set<string>();

  for (const ship of ships) {
    const definition = FLEET.find(({ id }) => id === ship.shipId);
    expect(definition).toBeDefined();
    for (let index = 0; index < definition!.length; index++) {
      const coord =
        ship.orientation === 'horizontal'
          ? { row: ship.origin.row, col: ship.origin.col + index }
          : { row: ship.origin.row + index, col: ship.origin.col };
      expect(isInBounds(coord)).toBe(true);
      expect(occupied.has(key(coord))).toBe(false);
      occupied.add(key(coord));
    }
  }
}

function assertUniqueShots(board: Board) {
  const coordinates = board.shots.map(({ coord }) => key(coord));
  expect(new Set(coordinates).size).toBe(coordinates.length);
}

function assertStateInvariants(state: GameState) {
  assertUniqueShots(state.boards.player);
  assertUniqueShots(state.boards.computer);

  for (let index = 1; index < state.log.length; index++) {
    expect(state.log[index]!.id).toBe(state.log[index - 1]!.id + 1);
  }

  const gameOverEvents = state.log.filter((event) => event.kind === 'gameOver');
  expect(gameOverEvents.length).toBeLessThanOrEqual(1);
  if (gameOverEvents.length === 1) {
    expect(state.log.at(-1)?.kind).toBe('gameOver');
  }

  const destroyed =
    isFleetDestroyed(state.boards.player) || isFleetDestroyed(state.boards.computer);
  expect(state.phase === 'gameOver').toBe(destroyed);

  const shotCount = state.boards.player.shots.length + state.boards.computer.shots.length;
  expect(shotCount).toBeLessThan(200);

  if (state.phase === 'battle') {
    expect(state.boards.computer.shots.length - state.boards.player.shots.length).toBe(
      state.turn === 'computer' ? 1 : 0,
    );
    expect(state.winner).toBeNull();
  } else if (state.phase === 'gameOver') {
    const lastShot = [...state.log].reverse().find((event) => event.kind === 'shot');
    expect(lastShot).toBeDefined();
    expect(state.winner).toBe(lastShot?.attacker);
    expect(gameOverEvents[0]?.winner).toBe(lastShot?.attacker);
    expect(state.boards.computer.shots.length - state.boards.player.shots.length).toBe(
      state.winner === 'player' ? 1 : 0,
    );
  } else {
    expect(state.winner).toBeNull();
  }
}

function expectIllegalBattleActionsToPreserveState(state: GameState) {
  const actions: GameAction[] = [
    { type: 'PLAYER_FIRE', coord: { row: 10, col: 0 } },
    { type: 'PLAYER_FIRE', coord: { row: -1, col: 3 } },
    {
      type: 'PLACE_SHIP',
      placement: {
        shipId: 'scoutShip',
        origin: { row: 8, col: 0 },
        orientation: 'horizontal',
      },
    },
    { type: 'REMOVE_SHIP', shipId: 'greatLongship' },
    { type: 'AUTO_PLACE' },
    { type: 'CLEAR_FLEET' },
    { type: 'START_BATTLE' },
  ];
  const alreadyFired = state.boards.computer.shots[0]?.coord;
  if (alreadyFired) actions.push({ type: 'PLAYER_FIRE', coord: alreadyFired });

  if (state.turn === 'computer') {
    const openCell = allCells.find(
      (coord) => !state.boards.computer.shots.some((shot) => key(shot.coord) === key(coord)),
    );
    expect(openCell).toBeDefined();
    actions.push(
      { type: 'PLAYER_FIRE', coord: openCell! },
      { type: 'COMPUTER_FIRE', gameId: state.gameId + 1 },
    );
  } else {
    actions.push({ type: 'COMPUTER_FIRE', gameId: state.gameId });
  }

  for (const action of actions) {
    expect(gameReducer(state, action)).toBe(state);
  }
}

describe('game simulations', () => {
  it('preserves reducer invariants through 150 full games against a seeded legal player', () => {
    for (let seed = 0; seed < 150; seed++) {
      let state = createGame({ seed });
      state = gameReducer(state, { type: 'AUTO_PLACE' });
      state = gameReducer(state, { type: 'START_BATTLE' });
      const playerRng = new Rng(seed ^ 0x9e3779b9);
      let steps = 0;

      while (state.phase === 'battle' && steps < 200) {
        expectIllegalBattleActionsToPreserveState(state);
        const previous = state;

        if (state.turn === 'player') {
          const fired = new Set(state.boards.computer.shots.map(({ coord }) => key(coord)));
          const open = allCells.filter((coord) => !fired.has(key(coord)));
          state = gameReducer(state, {
            type: 'PLAYER_FIRE',
            coord: playerRng.pick(open),
          });
        } else {
          state = gameReducer(state, { type: 'COMPUTER_FIRE', gameId: state.gameId });
        }

        expect(state).not.toBe(previous);
        steps++;
        assertStateInvariants(state);
      }

      expect(state.phase).toBe('gameOver');
      const openEnemyCell = allCells.find(
        (coord) => !state.boards.computer.shots.some((shot) => key(shot.coord) === key(coord)),
      );
      expect(openEnemyCell).toBeDefined();
      expect(gameReducer(state, { type: 'PLAYER_FIRE', coord: openEnemyCell! })).toBe(state);
      expect(gameReducer(state, { type: 'COMPUTER_FIRE', gameId: state.gameId })).toBe(state);

      const next = gameReducer(state, { type: 'NEW_GAME' });
      expect(next.phase).toBe('placement');
      expect(next.gameId).toBe(state.gameId + 1);
      expect(next.boards.player).toEqual({ ships: [], shots: [] });
      expect(next.boards.computer.shots).toEqual([]);
      expect(next.log).toEqual([]);
      expect(next.winner).toBeNull();
      expect(next.turn).toBe('player');
      assertFleetIsLegal(next.boards.computer.ships);
    }
  }, 15_000);

  it('matches an independent placement oracle across 100 seeds and 200 attempts each', () => {
    const shipIds = FLEET.map(({ id }) => id);

    const cellsFor = (placement: ShipPlacement) => {
      const length = FLEET.find(({ id }) => id === placement.shipId)!.length;
      return Array.from({ length }, (_, index) =>
        placement.orientation === 'horizontal'
          ? { row: placement.origin.row, col: placement.origin.col + index }
          : { row: placement.origin.row + index, col: placement.origin.col },
      );
    };

    const isOracleLegal = (ships: ShipPlacement[], candidate: ShipPlacement) => {
      if (ships.some(({ shipId }) => shipId === candidate.shipId)) return false;
      const occupied = new Set(ships.flatMap((ship) => cellsFor(ship).map(key)));
      const cells = cellsFor(candidate);
      return cells.every((coord) => isInBounds(coord) && !occupied.has(key(coord)));
    };

    const assertBoardLegal = (ships: ShipPlacement[]) => {
      const occupied = new Set<string>();
      expect(new Set(ships.map(({ shipId }) => shipId)).size).toBe(ships.length);
      for (const ship of ships) {
        for (const coord of cellsFor(ship)) {
          expect(isInBounds(coord)).toBe(true);
          expect(occupied.has(key(coord))).toBe(false);
          occupied.add(key(coord));
        }
      }
    };

    for (let seed = 0; seed < 100; seed++) {
      let state = createGame({ seed });
      let oracleShips: ShipPlacement[] = [];
      const rng = new Rng(seed ^ 0x85ebca6b);

      for (let attempt = 0; attempt < 200; attempt++) {
        if (rng.int(6) === 0) {
          const shipId = rng.pick(shipIds) as ShipId;
          const present = oracleShips.some((ship) => ship.shipId === shipId);
          const previous = state;
          const next = gameReducer(state, { type: 'REMOVE_SHIP', shipId });
          if (present) {
            expect(next).not.toBe(previous);
            state = next;
            oracleShips = oracleShips.filter((ship) => ship.shipId !== shipId);
          } else {
            expect(next).toBe(previous);
          }
        } else {
          const candidate: ShipPlacement = {
            shipId: rng.pick(shipIds) as ShipId,
            origin: { row: rng.int(12) - 1, col: rng.int(12) - 1 },
            orientation: rng.int(2) === 0 ? 'horizontal' : 'vertical',
          };
          const acceptedByOracle = isOracleLegal(oracleShips, candidate);
          const previous = state;
          const next = gameReducer(state, { type: 'PLACE_SHIP', placement: candidate });
          if (acceptedByOracle) {
            expect(next).not.toBe(previous);
            state = next;
            oracleShips = [...oracleShips, candidate];
          } else {
            expect(next).toBe(previous);
          }
        }

        expect(state.boards.player.ships).toEqual(oracleShips);
        assertBoardLegal(state.boards.player.ships);
        const start = gameReducer(state, { type: 'START_BATTLE' });
        if (oracleShips.length === FLEET.length) {
          expect(start).not.toBe(state);
          expect(start.phase).toBe('battle');
        } else {
          expect(start).toBe(state);
        }
      }
    }

    let complete = createGame({ seed: 0 });
    for (const placement of [
      { shipId: 'greatLongship', origin: { row: 0, col: 0 }, orientation: 'horizontal' },
      { shipId: 'dragonship', origin: { row: 2, col: 0 }, orientation: 'horizontal' },
      { shipId: 'warLongship', origin: { row: 4, col: 0 }, orientation: 'horizontal' },
      { shipId: 'raider', origin: { row: 6, col: 0 }, orientation: 'horizontal' },
      { shipId: 'scoutShip', origin: { row: 8, col: 0 }, orientation: 'horizontal' },
    ] satisfies ShipPlacement[]) {
      complete = gameReducer(complete, { type: 'PLACE_SHIP', placement });
    }
    expect(gameReducer(complete, { type: 'START_BATTLE' }).phase).toBe('battle');
  }, 15_000);
});
