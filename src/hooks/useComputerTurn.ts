import { useEffect, type Dispatch } from 'react';
import type { GameAction, GameState } from '../engine';

export const COMPUTER_TURN_DELAY_MS = 650;

/** Schedules the computer's shot after a short pause; the move carries `gameId` so a stale one is discarded. */
export function useComputerTurn(
  state: GameState,
  dispatch: Dispatch<GameAction>,
  delayMs = COMPUTER_TURN_DELAY_MS,
) {
  const { phase, turn, gameId } = state;
  const shotCount = state.boards.player.shots.length;

  useEffect(() => {
    if (phase !== 'battle' || turn !== 'computer') return;
    const timer = window.setTimeout(() => dispatch({ type: 'COMPUTER_FIRE', gameId }), delayMs);
    return () => window.clearTimeout(timer);
  }, [phase, turn, gameId, shotCount, delayMs, dispatch]);
}
