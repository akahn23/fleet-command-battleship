import { useEffect, useRef } from 'react';
import type { GameState } from '../engine';
import type { Soundscape } from '../audio/soundscape';

export function useBattleSounds(state: GameState, soundscape: Soundscape | null) {
  const lastEntry = useRef({ gameId: state.gameId, id: 0 });

  useEffect(() => {
    if (lastEntry.current.gameId !== state.gameId) {
      lastEntry.current = { gameId: state.gameId, id: 0 };
    }
    for (const entry of state.log) {
      if (entry.id <= lastEntry.current.id) continue;
      if (entry.kind === 'shot' && entry.attacker === 'player') {
        if (entry.result === 'hit') {
          if (entry.sunk) soundscape?.playSink();
          else soundscape?.playHit();
        }
      }
      lastEntry.current.id = entry.id;
    }
  }, [state.gameId, state.log, soundscape]);
}
