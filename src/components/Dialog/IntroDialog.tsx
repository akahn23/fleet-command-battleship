import { useEffect, useRef } from 'react';
import './IntroDialog.css';

interface IntroDialogProps {
  onClose: () => void;
}

export function IntroDialog({ onClose }: IntroDialogProps) {
  const begin = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    begin.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div className="dialog-backdrop intro-dialog-backdrop">
      <div
        className="dialog intro-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="how-to-play-title"
      >
        <h2 id="how-to-play-title">How to Play</h2>
        <ol className="intro-dialog__steps">
          <li className="intro-dialog__step">
            <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
              <path d="M5 33h38l-7 8H14z" fill="none" stroke="currentColor" strokeWidth="2" />
              <path
                d="M24 8v25M24 11l13 15H24M20 18 9 29h11"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M4 44q5-3 10 0t10 0t10 0t10 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <div>
              <h3>Muster your fleet</h3>
              <p>
                Place your five ships one at a time: <span className="only-fine">Click</span>
                <span className="only-coarse">Tap</span> your grid, rotate with{' '}
                <span className="only-fine">R or </span>
                Rotate Ship, and <span className="only-fine">drag a moored ship</span>
                <span className="only-coarse">drag with your finger</span> to move it. Or use
                Auto-Place to place all ships at once, then press Start Battle.
              </p>
            </div>
          </li>
          <li className="intro-dialog__step">
            <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
              <path
                d="m11 10 27 28M37 10 10 38M9 9l8 2-6 6zM39 9l-8 2 6 6z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                opacity=".55"
              />
            </svg>
            <div>
              <h3>Take turns firing</h3>
              <p>
                You fire first, with one shot per turn. A flame marks a hit and a splash marks a
                miss; then the enemy fires back.
              </p>
            </div>
          </li>
          <li className="intro-dialog__step">
            <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false">
              <path d="M7 7h34v34H7z" fill="none" stroke="currentColor" strokeWidth="1.5" />
              <path
                d="M12 28q6-10 12 0t12 0M15 33h18M24 11v9"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="m20 15 4-4 4 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            <div>
              <h3>Sink the whole fleet</h3>
              <p>
                A ship sinks when each of its squares are hit. The first side to sink all five enemy
                ships wins.
              </p>
            </div>
          </li>
        </ol>
        <div className="intro-dialog__actions">
          <button ref={begin} type="button" className="btn btn--primary" onClick={onClose}>
            Begin
          </button>
        </div>
      </div>
    </div>
  );
}
