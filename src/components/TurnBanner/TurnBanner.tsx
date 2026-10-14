import type { GameState } from '../../engine';
import { describeEvent } from '../../ui/messages';
import './TurnBanner.css';

function headline(state: GameState): string {
  if (state.phase === 'placement') return 'Muster your fleet in home waters';
  if (state.phase === 'gameOver') return state.winner === 'player' ? 'Victory' : 'Defeat';
  return state.turn === 'player' ? 'Your turn — strike at enemy waters' : 'The enemy takes aim…';
}

export function TurnBanner({ state }: { state: GameState }) {
  const lastShot = [...state.log].reverse().find((entry) => entry.kind === 'shot');
  const tone =
    state.phase === 'gameOver'
      ? state.winner === 'player'
        ? 'good'
        : 'bad'
      : state.phase === 'battle'
        ? state.turn === 'player'
          ? 'player'
          : 'enemy'
        : 'neutral';

  return (
    <div className={`turn-banner turn-banner--${tone}`} role="status" aria-live="polite">
      <p className="turn-banner__headline" data-testid="turn-headline">
        {headline(state)}
      </p>
      {state.phase !== 'placement' && lastShot && (
        <p className="turn-banner__detail">{describeEvent(lastShot)}</p>
      )}
    </div>
  );
}
