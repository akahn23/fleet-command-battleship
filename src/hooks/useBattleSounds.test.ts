import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { allCoords, createGame, gameReducer, shipCells, type GameState } from '../engine';
import type { Soundscape } from '../audio/soundscape';
import { useBattleSounds } from './useBattleSounds';

function shot(state: GameState, coord: { row: number; col: number }) {
  let next = gameReducer(state, { type: 'PLAYER_FIRE', coord });
  if (next.phase === 'battle' && next.turn === 'computer') {
    next = gameReducer(next, { type: 'COMPUTER_FIRE', gameId: next.gameId });
  }
  return next;
}

describe('useBattleSounds', () => {
  it('plays each player hit and sink once, but ignores misses and computer shots', () => {
    let state = gameReducer(createGame({ seed: 17 }), { type: 'AUTO_PLACE' });
    state = gameReducer(state, { type: 'START_BATTLE' });
    const ship = state.boards.computer.ships[0]!;
    const shipCoords = shipCells(ship);
    const occupied = new Set(
      state.boards.computer.ships.flatMap(shipCells).map(({ row, col }) => `${row},${col}`),
    );
    const miss = allCoords().find(({ row, col }) => !occupied.has(`${row},${col}`))!;

    state = shot(state, miss);
    for (const coord of shipCoords) state = shot(state, coord);

    const sounds: Soundscape = {
      setEnabled: vi.fn(),
      unlock: vi.fn(),
      playHit: vi.fn(),
      playSink: vi.fn(),
      dispose: vi.fn(),
    };
    const { rerender } = renderHook(
      ({ game }: { game: GameState }) => useBattleSounds(game, sounds),
      { initialProps: { game: state } },
    );
    rerender({ game: state });

    expect(sounds.playHit).toHaveBeenCalledTimes(shipCoords.length - 1);
    expect(sounds.playSink).toHaveBeenCalledTimes(1);
    expect(state.log.some((entry) => entry.kind === 'shot' && entry.attacker === 'computer')).toBe(
      true,
    );
    expect(
      state.log.some(
        (entry) => entry.kind === 'shot' && entry.attacker === 'player' && entry.result === 'miss',
      ),
    ).toBe(true);
  });
});
