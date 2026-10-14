import { useEffect, useRef } from 'react';
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
  const newBattleRef = useRef<HTMLButtonElement>(null);
  // Set only when the player answers the prompt, so a game ending mid-prompt
  // leaves focus with the result dialog.
  const restoreFocus = useRef(false);

  useEffect(() => {
    if (!confirming && restoreFocus.current) {
      restoreFocus.current = false;
      newBattleRef.current?.focus();
    }
  }, [confirming]);

  const answer = (choice: () => void) => () => {
    restoreFocus.current = true;
    choice();
  };

  return (
    <header className="site-header">
      <div className="site-header__brand">
        <svg
          className="site-header__raven"
          viewBox="0 0 64 64"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id="rf-banner-field" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#e9e0c9" />
              <stop offset="1" stopColor="#c9b48a" />
            </linearGradient>
          </defs>
          <path fill="none" stroke="#a9783f" strokeWidth="2.4" strokeLinecap="round" d="M6 5 V62" />
          <path fill="#dfb96d" d="M6 0.5 L8.5 3.5 L6 6.5 L3.5 3.5 Z" />
          <path
            fill="url(#rf-banner-field)"
            stroke="#a9783f"
            strokeWidth="1.6"
            strokeLinejoin="round"
            d="M7 7 H59 C55 32 34 50 7 59 Z"
          />
          <path
            fill="none"
            stroke="#a9783f"
            strokeWidth="0.7"
            opacity="0.7"
            d="M10 10 H54.5 C50.5 31 32 46 10 54.5 Z"
          />
          <path
            fill="#0f1d26"
            d="M51 21.5 L42 14.5 Q37.5 10.5 31.5 11.5 Q25.5 12.5 22 18.5 L16 28 L9.5 39.5 L15 40 L14 44 L22 37.5 Q30 36.5 35 31 L38 27 L40.5 26 L39.6 24.8 L42.2 24 L41.4 22.9 L44 22.4 Z"
          />
          <path
            fill="none"
            stroke="#d9cba8"
            strokeWidth="1.1"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M22.5 22.5 Q31 21.5 35.5 28 M20 27.5 Q26 27.5 29.5 31.5 M17.5 32 Q21.5 32.5 24 35"
          />
          <circle cx="37.2" cy="16.6" r="1.15" fill="#dfb96d" />
          <path
            fill="none"
            stroke="#0f1d26"
            strokeWidth="1.6"
            strokeLinecap="round"
            d="M27.5 36.5 L26.5 44 M31.5 35 L32.5 44 M24.5 44.5 H35"
          />
        </svg>
        <div>
          <h1>Ravenfjord</h1>
          <p className="site-header__tagline">A Viking war of wits upon the northern sea</p>
        </div>
      </div>
      {confirming ? (
        <div className="site-header__confirm" role="group" aria-labelledby="abandon-prompt">
          <span id="abandon-prompt">Abandon this battle?</span>
          <button type="button" className="btn" onClick={answer(onCancel)} autoFocus>
            Keep Fighting
          </button>
          <button type="button" className="btn btn--danger" onClick={answer(onConfirm)}>
            Abandon Battle
          </button>
        </div>
      ) : (
        <button
          ref={newBattleRef}
          id={NEW_BATTLE_BUTTON_ID}
          type="button"
          className="btn"
          onClick={onNewGame}
        >
          New Battle
        </button>
      )}
    </header>
  );
}
