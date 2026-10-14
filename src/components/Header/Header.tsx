import './Header.css';

interface HeaderProps {
  /** True while asking whether to abandon an unfinished battle. */
  confirming: boolean;
  onNewGame: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export const NEW_BATTLE_BUTTON_ID = 'new-battle-button';

export function Header({ confirming, onNewGame, onConfirm, onCancel }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header__brand">
        <svg className="site-header__raven" viewBox="0 0 48 48" aria-hidden="true">
          <circle cx="24" cy="24" r="22" fill="none" stroke="var(--bronze)" strokeWidth="2" />
          <path
            d="M10 28 C16 22 22 20 28 21 L34 15 L33 21 C37 22 39 25 40 28 C35 26 31 27 28 30 L24 36 L23 30 C19 30 14 30 10 28 Z"
            fill="var(--parchment)"
          />
          <circle cx="32" cy="19.5" r="1" fill="var(--sea-deep)" />
        </svg>
        <div>
          <h1>Ravenfjord</h1>
          <p className="site-header__tagline">A Viking war of wits upon the northern sea</p>
        </div>
      </div>
      {confirming ? (
        <div className="site-header__confirm" role="group" aria-labelledby="abandon-prompt">
          <span id="abandon-prompt">Abandon this battle?</span>
          <button type="button" className="btn" onClick={onCancel} autoFocus>
            Keep Fighting
          </button>
          <button type="button" className="btn btn--danger" onClick={onConfirm}>
            Abandon Battle
          </button>
        </div>
      ) : (
        <button id={NEW_BATTLE_BUTTON_ID} type="button" className="btn" onClick={onNewGame}>
          New Battle
        </button>
      )}
    </header>
  );
}
