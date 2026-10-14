import { isFleetDestroyed, shipCells } from './board';
import { formatCoord } from './coords';
import { createGame, createReducer, gameReducer, type GameAction } from './game';
import type { TargetingStrategy } from './ai/randomAI';
import { COLUMN_FLEET, ROW_FLEET, battleState } from './testUtils';
import type { Coord, GameState } from './types';

const run = (state: GameState, ...actions: GameAction[]) => actions.reduce(gameReducer, state);
const fireAt = (coord: Coord): GameAction => ({ type: 'PLAYER_FIRE', coord });
const computerFire = (state: GameState): GameAction => ({
  type: 'COMPUTER_FIRE',
  gameId: state.gameId,
});

/** Plays one full player turn followed by the computer's reply. */
function exchange(state: GameState, coord: Coord): GameState {
  const afterPlayer = gameReducer(state, fireAt(coord));
  return afterPlayer.phase === 'battle'
    ? gameReducer(afterPlayer, computerFire(afterPlayer))
    : afterPlayer;
}

describe('createGame', () => {
  it('starts in placement with an empty player board and a hidden, complete enemy fleet', () => {
    const game = createGame({ seed: 1 });
    expect(game.phase).toBe('placement');
    expect(game.turn).toBe('player');
    expect(game.winner).toBeNull();
    expect(game.log).toEqual([]);
    expect(game.boards.player).toEqual({ ships: [], shots: [] });
    expect(game.boards.computer.ships).toHaveLength(5);
    expect(game.boards.computer.shots).toEqual([]);
  });

  it('places the computer fleet reproducibly from the seed', () => {
    expect(createGame({ seed: 5 }).boards.computer).toEqual(
      createGame({ seed: 5 }).boards.computer,
    );
    expect(createGame({ seed: 5 }).boards.computer).not.toEqual(
      createGame({ seed: 6 }).boards.computer,
    );
  });
});

describe('placement phase', () => {
  const start = createGame({ seed: 1 });
  const scout = {
    shipId: 'scoutShip',
    origin: { row: 0, col: 0 },
    orientation: 'horizontal',
  } as const;

  it('places a valid ship', () => {
    const next = run(start, { type: 'PLACE_SHIP', placement: scout });
    expect(next.boards.player.ships).toEqual([scout]);
  });

  it.each([
    ['out of bounds', { ...scout, origin: { row: 0, col: 9 } }],
    [
      'vertical out of bounds',
      { ...scout, orientation: 'vertical' as const, origin: { row: 9, col: 0 } },
    ],
  ])('rejects a placement that is %s (state unchanged)', (_label, placement) => {
    expect(run(start, { type: 'PLACE_SHIP', placement })).toBe(start);
  });

  it('rejects overlap and duplicate ships', () => {
    const placed = run(start, { type: 'PLACE_SHIP', placement: scout });
    const overlap = {
      shipId: 'raider',
      origin: { row: 0, col: 1 },
      orientation: 'vertical',
    } as const;
    expect(run(placed, { type: 'PLACE_SHIP', placement: overlap })).toBe(placed);
    expect(
      run(placed, { type: 'PLACE_SHIP', placement: { ...scout, origin: { row: 5, col: 5 } } }),
    ).toBe(placed);
  });

  it('removes a ship so it can be re-placed', () => {
    const placed = run(start, { type: 'PLACE_SHIP', placement: scout });
    const removed = run(placed, { type: 'REMOVE_SHIP', shipId: 'scoutShip' });
    expect(removed.boards.player.ships).toEqual([]);
    expect(run(removed, { type: 'REMOVE_SHIP', shipId: 'scoutShip' })).toBe(removed);
  });

  it('auto-places a complete legal fleet, and re-rolls on repeat', () => {
    const once = run(start, { type: 'AUTO_PLACE' });
    expect(once.boards.player.ships).toHaveLength(5);
    const twice = run(once, { type: 'AUTO_PLACE' });
    expect(twice.boards.player.ships).toHaveLength(5);
    expect(twice.boards.player.ships).not.toEqual(once.boards.player.ships);
  });

  it('auto-place replaces partially placed ships', () => {
    const partial = run(start, { type: 'PLACE_SHIP', placement: scout });
    expect(run(partial, { type: 'AUTO_PLACE' }).boards.player.ships).toHaveLength(5);
  });

  it('clears the fleet', () => {
    const full = run(start, { type: 'AUTO_PLACE' });
    expect(run(full, { type: 'CLEAR_FLEET' }).boards.player.ships).toEqual([]);
  });

  it('only starts the battle once all five ships are placed', () => {
    const partial = run(start, { type: 'PLACE_SHIP', placement: scout });
    expect(run(partial, { type: 'START_BATTLE' })).toBe(partial);

    const ready = run(start, { type: 'AUTO_PLACE' });
    const battle = run(ready, { type: 'START_BATTLE' });
    expect(battle.phase).toBe('battle');
    expect(battle.turn).toBe('player');
    expect(battle.log.map((e) => e.kind)).toEqual(['battleStart']);
  });

  it('rejects firing before the battle starts', () => {
    expect(run(start, fireAt({ row: 0, col: 0 }))).toBe(start);
    expect(run(start, computerFire(start))).toBe(start);
  });
});

describe('battle turns', () => {
  const battle = battleState();

  it('the player fires first; a miss passes the turn', () => {
    const next = run(battle, fireAt({ row: 9, col: 9 }));
    expect(next.turn).toBe('computer');
    expect(next.boards.computer.shots).toEqual([{ coord: { row: 9, col: 9 }, result: 'miss' }]);
    expect(next.log.at(-1)).toMatchObject({ kind: 'shot', attacker: 'player', result: 'miss' });
  });

  it('a hit does NOT grant an extra turn', () => {
    const next = run(battle, fireAt({ row: 0, col: 0 }));
    expect(next.boards.computer.shots[0]?.result).toBe('hit');
    expect(next.turn).toBe('computer');
    expect(run(next, fireAt({ row: 1, col: 0 }))).toBe(next);
  });

  it('the computer fires exactly once, then it is the player’s turn', () => {
    const afterPlayer = run(battle, fireAt({ row: 9, col: 9 }));
    const afterComputer = run(afterPlayer, computerFire(afterPlayer));
    expect(afterComputer.boards.player.shots).toHaveLength(1);
    expect(afterComputer.turn).toBe('player');
    expect(run(afterComputer, computerFire(afterComputer))).toBe(afterComputer);
  });

  it('the computer cannot fire on the player’s turn', () => {
    expect(run(battle, computerFire(battle))).toBe(battle);
  });

  it('rejects firing at the same square twice without consuming the turn', () => {
    const back = exchange(battle, { row: 9, col: 9 });
    expect(back.turn).toBe('player');
    const repeat = run(back, fireAt({ row: 9, col: 9 }));
    expect(repeat).toBe(back);
    expect(repeat.turn).toBe('player');
  });

  it('rejects out-of-bounds targets', () => {
    expect(run(battle, fireAt({ row: 10, col: 0 }))).toBe(battle);
    expect(run(battle, fireAt({ row: 0, col: -1 }))).toBe(battle);
  });

  it('discards a computer move scheduled for a previous game', () => {
    const afterPlayer = run(battle, fireAt({ row: 9, col: 9 }));
    const stale = run(afterPlayer, { type: 'COMPUTER_FIRE', gameId: afterPlayer.gameId - 1 });
    expect(stale).toBe(afterPlayer);
  });

  it('announces a sunk ship by class', () => {
    // COLUMN_FLEET scout ship occupies I1-I2 (row 0-1, col 8).
    let state = exchange(battle, { row: 0, col: 8 });
    state = run(state, fireAt({ row: 1, col: 8 }));
    expect(state.log.at(-1)).toMatchObject({
      kind: 'shot',
      attacker: 'player',
      result: 'hit',
      sunk: 'scoutShip',
    });
  });
});

describe('game over', () => {
  it('player victory ends the game immediately on the final hit', () => {
    let state = battleState();
    const targets = COLUMN_FLEET.flatMap(shipCells);
    for (const target of targets) state = exchange(state, target);

    expect(state.phase).toBe('gameOver');
    expect(state.winner).toBe('player');
    expect(isFleetDestroyed(state.boards.computer)).toBe(true);
    // The computer never got a reply to the winning shot.
    expect(state.boards.player.shots).toHaveLength(targets.length - 1);
    expect(state.log.at(-1)).toMatchObject({ kind: 'gameOver', winner: 'player' });
  });

  it('computer victory ends the game, and no side may fire afterwards', () => {
    // Test-only strategy that walks a script of coordinates, to drive a defeat deterministically.
    const script = ROW_FLEET.flatMap(shipCells);
    let i = 0;
    const scripted: TargetingStrategy = () => script[i++]!;
    const reducer = createReducer(scripted);

    let state = battleState();

    // Player fires only at open water: COLUMN_FLEET never touches odd columns in rows 6-10.
    const openWater: Coord[] = [];
    for (let row = 5; row < 10; row++)
      for (let col = 1; col < 10; col += 2) openWater.push({ row, col });

    for (const target of openWater) {
      state = reducer(state, fireAt(target));
      state = reducer(state, { type: 'COMPUTER_FIRE', gameId: state.gameId });
      if (state.phase === 'gameOver') break;
    }

    expect(state.phase).toBe('gameOver');
    expect(state.winner).toBe('computer');
    expect(isFleetDestroyed(state.boards.player)).toBe(true);
    expect(reducer(state, fireAt({ row: 0, col: 9 }))).toBe(state);
    expect(reducer(state, { type: 'COMPUTER_FIRE', gameId: state.gameId })).toBe(state);
  });
});

describe('NEW_GAME', () => {
  it('fully resets from any phase and re-rolls the enemy fleet', () => {
    let mid = battleState();
    mid = exchange(mid, { row: 0, col: 0 });
    const fresh = run(mid, { type: 'NEW_GAME' });

    expect(fresh.gameId).toBe(mid.gameId + 1);
    expect(fresh.phase).toBe('placement');
    expect(fresh.turn).toBe('player');
    expect(fresh.winner).toBeNull();
    expect(fresh.log).toEqual([]);
    expect(fresh.boards.player).toEqual({ ships: [], shots: [] });
    expect(fresh.boards.computer.shots).toEqual([]);
    expect(fresh.boards.computer.ships).toHaveLength(5);
    expect(fresh.boards.computer.ships).not.toEqual(mid.boards.computer.ships);
  });

  it('can be seeded explicitly for reproducible games', () => {
    const a = run(createGame({ seed: 1 }), { type: 'NEW_GAME', seed: 77 });
    const b = run(createGame({ seed: 2 }), { type: 'NEW_GAME', seed: 77 });
    expect(a.boards.computer).toEqual(b.boards.computer);
  });

  it('works from game over', () => {
    let state = battleState();
    for (const target of COLUMN_FLEET.flatMap(shipCells)) state = exchange(state, target);
    expect(state.phase).toBe('gameOver');
    expect(run(state, { type: 'NEW_GAME' }).phase).toBe('placement');
  });
});

describe('full simulated games (random player vs random AI)', () => {
  it('always ends with a legal winner and strictly alternating turns (300 seeds)', () => {
    for (let seed = 1; seed <= 300; seed++) {
      let state = run(createGame({ seed }), { type: 'AUTO_PLACE' }, { type: 'START_BATTLE' });
      const playerTargets = [...Array(100).keys()]
        .map((n) => ({ row: Math.floor(n / 10), col: n % 10 }))
        .sort(
          (a, b) =>
            ((a.row * 37 + a.col * 11 + seed) % 100) - ((b.row * 37 + b.col * 11 + seed) % 100),
        );

      let guard = 0;
      while (state.phase === 'battle' && guard++ < 250) {
        if (state.turn === 'player') {
          const target = playerTargets.shift()!;
          state = gameReducer(state, fireAt(target));
        } else {
          state = gameReducer(state, computerFire(state));
        }
      }

      expect(state.phase).toBe('gameOver');
      const shots = state.log.filter((e) => e.kind === 'shot');
      shots.forEach((e, i) => expect(e.attacker).toBe(i % 2 === 0 ? 'player' : 'computer'));
      expect(shots.at(-1)?.attacker).toBe(state.winner);
      const loser = state.winner === 'player' ? 'computer' : 'player';
      expect(isFleetDestroyed(state.boards[loser])).toBe(true);
      expect(isFleetDestroyed(state.boards[state.winner!])).toBe(false);
      for (const side of ['player', 'computer'] as const) {
        const keys = state.boards[side].shots.map((s) => formatCoord(s.coord));
        expect(new Set(keys).size).toBe(keys.length);
        expect(keys.length).toBeLessThanOrEqual(100);
      }
    }
  });
});
