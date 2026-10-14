import { useId } from 'react';
import { getShip, type ShipPlacement } from '../../engine';
import './ShipSprite.css';

/** One board cell in SVG units; ships are drawn `length` cells long and stretched to fit exactly. */
const U = 40;

export type ShipVariant = 'afloat' | 'sunk' | 'ghost';

interface ShipSpriteProps {
  placement: ShipPlacement;
  variant?: ShipVariant;
}

/** A longship laid into the board's own grid, so it always covers exactly its cells. */
export function ShipSprite({ placement, variant = 'afloat' }: ShipSpriteProps) {
  const { length } = getShip(placement.shipId);
  const vertical = placement.orientation === 'vertical';
  const { row, col } = placement.origin;
  const W = length * U;

  return (
    <div
      className={`ship ship--${variant}`}
      style={{
        gridRow: `${row + 2} / span ${vertical ? length : 1}`,
        gridColumn: `${col + 2} / span ${vertical ? 1 : length}`,
      }}
      data-testid={`ship-${placement.shipId}`}
      data-variant={variant}
      aria-hidden="true"
    >
      <svg
        viewBox={vertical ? `0 0 ${U} ${W}` : `0 0 ${W} ${U}`}
        preserveAspectRatio="none"
        width="100%"
        height="100%"
      >
        <g transform={vertical ? `translate(${U} 0) rotate(90)` : undefined}>
          <Longship length={length} />
        </g>
      </svg>
    </div>
  );
}

function Longship({ length }: { length: number }) {
  const id = useId().replace(/:/g, '');
  const W = length * U;
  const shieldCount = Math.max(1, length * 2 - 2);
  const shieldStep = (W - 48) / Math.max(1, shieldCount - 1);
  const sailWidth = Math.min(30, W * 0.28);
  const shieldColors = ['var(--bronze)', 'var(--blood)', 'var(--parchment-dim)'];

  return (
    <>
      <defs>
        <linearGradient id={`hull-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--wood-light)" />
          <stop offset="0.55" stopColor="var(--wood)" />
          <stop offset="1" stopColor="var(--wood-dark)" />
        </linearGradient>
        <pattern id={`sail-${id}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="var(--parchment)" />
          <rect width="4" height="8" fill="var(--blood)" />
        </pattern>
      </defs>
      <ellipse cx={W / 2} cy={33} rx={W / 2 - 6} ry={4} fill="rgba(0,0,0,0.35)" />
      <path
        d={`M3 12 Q8 31 26 32 H${W - 26} Q${W - 8} 31 ${W - 3} 12 Q${W - 16} 23 ${W - 30} 23 H30 Q16 23 3 12 Z`}
        fill={`url(#hull-${id})`}
        stroke="var(--wood-dark)"
        strokeWidth="1.5"
      />
      <path d={`M16 27.5 H${W - 16}`} stroke="rgba(0,0,0,0.35)" strokeWidth="1" />
      <path
        d={`M${W - 3} 12 C ${W - 1} 4, ${W - 10} 2, ${W - 11} 8`}
        fill="none"
        stroke="var(--gold-muted)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M3 12 C 1 5, 9 3, 10 8"
        fill="none"
        stroke="var(--gold-muted)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line x1={W / 2} y1={22} x2={W / 2} y2={2} stroke="var(--wood-dark)" strokeWidth="2" />
      <rect
        x={W / 2 - sailWidth / 2}
        y={3}
        width={sailWidth}
        height={12}
        rx={1.5}
        fill={`url(#sail-${id})`}
        stroke="var(--wood-dark)"
        strokeWidth="1"
      />
      {Array.from({ length: shieldCount }, (_, i) => (
        <circle
          key={i}
          cx={shieldCount === 1 ? W / 2 : 24 + i * shieldStep}
          cy={22}
          r={4.2}
          fill={shieldColors[i % shieldColors.length]}
          stroke="var(--iron)"
          strokeWidth="1.2"
        />
      ))}
    </>
  );
}
