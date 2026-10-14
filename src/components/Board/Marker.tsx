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
          <g fill="none" stroke="var(--mist)">
            <circle cx="20" cy="20" r="11" strokeWidth="1.5" opacity="0.6" />
            <circle cx="20" cy="20" r="6" strokeWidth="2" />
            <circle cx="20" cy="20" r="2" fill="var(--parchment-dim)" stroke="none" />
          </g>
        ) : (
          <g className="marker__flame">
            <path
              d="M20 4 L24 14 L34 11 L27 20 L35 28 L24 26 L20 36 L16 26 L5 28 L13 20 L6 11 L16 14 Z"
              fill={kind === 'sunk' ? 'var(--blood)' : 'var(--ember)'}
            />
            <circle cx="20" cy="20" r="5.5" fill="var(--gold-muted)" />
          </g>
        )}
      </svg>
    </div>
  );
}
