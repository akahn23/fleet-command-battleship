import { useEffect, useRef } from 'react';
import type { GameState } from '../../engine';
import './GameOverDialog.css';

interface GameOverDialogProps {
  state: GameState;
  onNewGame: () => void;
  onDismiss: () => void;
}

export function GameOverDialog({ state, onNewGame, onDismiss }: GameOverDialogProps) {
  const primary = useRef<HTMLButtonElement>(null);
  const won = state.winner === 'player';
  const shots = state.boards.computer.shots;
  const hits = shots.filter((shot) => shot.result === 'hit').length;
  const accuracy = shots.length ? Math.round((hits / shots.length) * 100) : 0;

  useEffect(() => {
    primary.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onDismiss();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    <div className="dialog-backdrop">
      <div
        className={`dialog dialog--${won ? 'victory' : 'defeat'}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-over-title"
        aria-describedby="game-over-text"
      >
        <h2 id="game-over-title">{won ? 'Victory' : 'Defeat'}</h2>
        <p id="game-over-text">
          {won
            ? 'The enemy fleet lies broken on the fjord. Skalds will sing of this day.'
            : 'Your longships rest beneath the waves. The enemy rules these waters — for now.'}
        </p>
        <dl className="dialog__stats">
          <div>
            <dt>Volleys</dt>
            <dd>{shots.length}</dd>
          </div>
          <div>
            <dt>Hits</dt>
            <dd>{hits}</dd>
          </div>
          <div>
            <dt>Accuracy</dt>
            <dd>{accuracy}%</dd>
          </div>
        </dl>
        <div className="dialog__actions">
          <button ref={primary} type="button" className="btn btn--primary" onClick={onNewGame}>
            New Battle
          </button>
          <button type="button" className="btn" onClick={onDismiss}>
            View Battlefield
          </button>
        </div>
      </div>
    </div>
  );
}
