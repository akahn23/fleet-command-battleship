import type { Coord } from '../../engine';

export type MarkerKind = 'miss' | 'hit' | 'sunk';

/** Shot marker drawn above ships so hits on visible ships stay readable. */
export function Marker({ coord, kind }: { coord: Coord; kind: MarkerKind }) {
  return (
    <div
      className={`marker marker--${kind}`}
      style={{ gridRow: coord.row + 2, gridColumn: coord.col + 2 }}
      data-testid="marker"
      data-kind={kind}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" width="100%" height="100%">
        {kind === 'miss' ? (
          <>
            <g
              className="marker__splash"
              fill="none"
              stroke="var(--mist)"
              data-testid="splash-effect"
            >
              <circle className="marker__splash-ring" cx="20" cy="22" r="5" strokeWidth="1.5" />
              <circle
                className="marker__splash-ring marker__splash-ring--outer"
                cx="20"
                cy="22"
                r="8"
                strokeWidth="1.2"
              />
              <path
                className="marker__droplet"
                d="M12 17 Q10 13 11 10 Q14 12 13 16 Z M27 16 Q29 12 28 9 Q25 12 26 16 Z M20 12 Q18 8 20 5 Q22 8 21 12 Z M23 29 Q27 28 29 25 Q25 25 23 28 Z"
                fill="var(--mist)"
                stroke="none"
              />
            </g>
            <g className="marker__miss-static" fill="none" stroke="var(--mist)">
              <circle cx="20" cy="20" r="11" strokeWidth="1.5" opacity="0.6" />
              <circle cx="20" cy="20" r="6" strokeWidth="2" />
              <circle cx="20" cy="20" r="2" fill="var(--parchment-dim)" stroke="none" />
            </g>
          </>
        ) : (
          <>
            <g className="marker__impact" data-testid="hit-burst">
              <circle className="marker__flash" cx="20" cy="20" r="10" fill="var(--gold-muted)" />
              <path
                className="marker__ember"
                d="M20 3 V12 M20 28 V37 M3 20 H12 M28 20 H37 M8 8 L14 14 M26 26 L32 32 M32 8 L26 14 M14 26 L8 32"
                fill="none"
                stroke="var(--ember)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </g>
            <g className="marker__flame" data-testid="flame-marker">
              <path
                d="M20 5 C21 12 29 13 28 21 C34 29 28 36 20 36 C11 36 7 30 11 23 C13 19 17 17 16 11 C19 13 20 16 20 18 C25 14 23 9 20 5 Z"
                fill={kind === 'sunk' ? 'var(--blood)' : 'var(--ember)'}
              />
              <path
                d="M20 20 C23 24 25 26 23 30 C22 33 17 33 16 30 C14 27 17 24 20 20 Z"
                fill="var(--gold-muted)"
              />
              <circle cx="20" cy="29" r="2" fill="#fff0bf" />
            </g>
          </>
        )}
      </svg>
    </div>
  );
}
