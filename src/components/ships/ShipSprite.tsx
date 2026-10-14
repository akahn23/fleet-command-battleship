import { useId } from 'react';
import { getShip, type ShipId, type ShipPlacement } from '../../engine';
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
  const width = length * U;
  const id = useId().replace(/:/g, '');

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
        viewBox={vertical ? `0 0 ${U} ${width}` : `0 0 ${width} ${U}`}
        preserveAspectRatio="none"
        width="100%"
        height="100%"
      >
        <defs>
          <linearGradient id={`hull-great-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--wood-light)" />
            <stop offset="0.55" stopColor="var(--wood)" />
            <stop offset="1" stopColor="var(--wood-dark)" />
          </linearGradient>
          <linearGradient id={`hull-oak-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c49a62" />
            <stop offset="0.58" stopColor="var(--wood-light)" />
            <stop offset="1" stopColor="var(--wood)" />
          </linearGradient>
          <linearGradient id={`hull-tar-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#48413b" />
            <stop offset="0.55" stopColor="#292624" />
            <stop offset="1" stopColor="#141516" />
          </linearGradient>
          <linearGradient id={`hull-war-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8f6846" />
            <stop offset="0.58" stopColor="#60432f" />
            <stop offset="1" stopColor="#35271f" />
          </linearGradient>
          <radialGradient id={`shield-boss-${id}`} cx="35%" cy="30%">
            <stop offset="0" stopColor="#f2d58c" />
            <stop offset="0.55" stopColor="var(--gold-muted)" />
            <stop offset="1" stopColor="#765027" />
          </radialGradient>
          <pattern id={`sail-great-${id}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#e6d7b8" />
            <rect width="5" height="10" fill="#a5322d" />
          </pattern>
          <pattern id={`sail-dragon-${id}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#201d20" />
            <rect width="4" height="10" fill="#8d2028" />
          </pattern>
          <pattern id={`sail-war-${id}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#eee4ce" />
            <rect width="5" height="10" fill="#315a79" />
          </pattern>
          <pattern id={`sail-scout-${id}`} width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#d2a24f" />
            <rect width="3" height="10" fill="#f0dfba" />
          </pattern>
        </defs>
        <g transform={vertical ? `translate(${U} 0) rotate(90)` : undefined}>
          <ShipArtwork shipId={placement.shipId} width={width} id={id} />
        </g>
      </svg>
    </div>
  );
}

function ShipArtwork({ shipId, width, id }: { shipId: ShipId; width: number; id: string }) {
  switch (shipId) {
    case 'greatLongship':
      return <GreatLongship width={width} id={id} />;
    case 'dragonship':
      return <Dragonship width={width} id={id} />;
    case 'warLongship':
      return <WarLongship width={width} id={id} />;
    case 'raider':
      return <Raider width={width} id={id} />;
    case 'scoutShip':
      return <ScoutShip width={width} id={id} />;
    default:
      return null;
  }
}

function GreatLongship({ width, id }: { width: number; id: string }) {
  const shields = Array.from({ length: 8 }, (_, index) => 19 + index * ((width - 38) / 7));
  const colors = ['#a52c2c', '#e6d7b8', '#315a79', '#b7843b'];
  const sailWidth = 40;
  const center = width / 2;

  return (
    <>
      <ellipse cx={center} cy="32" rx={width / 2 - 12} ry="4" fill="rgba(0,0,0,.36)" />
      <path
        d={`M4 18 Q8 27 25 31 Q${center} 35 ${width - 25} 31 Q${width - 8} 27 ${width - 4} 18 Q${width - 20} 23 ${width - 34} 22 H34 Q18 23 4 18 Z`}
        fill={`url(#hull-great-${id})`}
        stroke="var(--wood-dark)"
        strokeWidth="1.4"
      />
      {[26, 29].map((y) => (
        <path
          key={y}
          d={`M16 ${y} Q${center} ${y + 2} ${width - 16} ${y}`}
          fill="none"
          stroke="rgba(27,17,11,.58)"
          strokeWidth=".8"
        />
      ))}
      {shields.map((x, index) => (
        <g key={x}>
          <line
            x1={x}
            y1="26"
            x2={x - 3}
            y2="37"
            stroke="var(--wood-dark)"
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <circle cx={x} cy="21.5" r="4.5" fill={colors[index % colors.length]} stroke="#211b18" />
          <circle cx={x} cy="21.5" r="1.15" fill={`url(#shield-boss-${id})`} />
        </g>
      ))}
      <line x1={center} y1="3" x2={center} y2="24" stroke="#3d2b1d" strokeWidth="2" />
      <rect
        x={center - sailWidth / 2}
        y="3"
        width={sailWidth}
        height="18"
        rx="1"
        fill={`url(#sail-great-${id})`}
        stroke="#32251c"
        strokeWidth="1"
      />
      <path
        d="M17 18 Q8 17 4 10 Q9 11 12 8 Q19 8 20 13 L16 16 Q21 17 22 20 Q17 20 13 18 Z"
        fill="#8a2c24"
        stroke="#382019"
        strokeWidth="1.1"
      />
      <path d="M7 16 Q13 17 19 18" fill="none" stroke="#ead6aa" strokeWidth="1" />
      <circle cx="13.5" cy="11.5" r="1" fill="var(--gold-muted)" />
      <path
        d={`M${width - 20} 19 C${width - 7} 17 ${width - 6} 7 ${width - 13} 8 C${width - 20} 8 ${width - 20} 16 ${width - 13} 15 C${width - 9} 14 ${width - 11} 11 ${width - 14} 12`}
        fill="none"
        stroke="var(--gold-muted)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  );
}

function Dragonship({ width, id }: { width: number; id: string }) {
  const center = width / 2;
  const sailWidth = Math.min(48, width * 0.38);

  return (
    <>
      <ellipse cx={center} cy="32" rx={width / 2 - 13} ry="3.5" fill="rgba(0,0,0,.44)" />
      <path
        d={`M7 19 Q14 28 31 31 Q${center} 34 ${width - 28} 30 Q${width - 8} 26 ${width - 5} 17 Q${width - 23} 23 ${width - 38} 22 H34 Q18 23 7 19 Z`}
        fill={`url(#hull-tar-${id})`}
        stroke="#111214"
        strokeWidth="1.5"
      />
      {[26, 29].map((y) => (
        <path
          key={y}
          d={`M24 ${y} Q${center} ${y + 1.5} ${width - 25} ${y}`}
          fill="none"
          stroke="#74685a"
          strokeWidth=".7"
        />
      ))}
      <line x1={center} y1="2" x2={center} y2="24" stroke="#262123" strokeWidth="2" />
      <rect
        x={center - sailWidth / 2}
        y="2"
        width={sailWidth}
        height="20"
        rx="1"
        fill={`url(#sail-dragon-${id})`}
        stroke="#140f12"
        strokeWidth="1"
      />
      <path
        d={`M${center - 8} 10 Q${center - 3} 5 ${center + 1} 8 L${center + 7} 6 L${center + 4} 10 L${center + 10} 12 L${center + 3} 13 L${center + 5} 17 L${center - 1} 14 L${center - 7} 17 L${center - 5} 12 L${center - 11} 10 Z`}
        fill="#d8c7a5"
        stroke="#20191a"
        strokeWidth=".7"
      />
      <path
        d="M19 19 Q7 17 4 8 Q11 11 14 6 Q24 6 22 13 L17 16 Q23 16 25 20 Q18 21 14 18 Z"
        fill="#423833"
        stroke="#151416"
        strokeWidth="1.3"
      />
      <path d="M7 15 Q15 15 22 19 M9 13 L18 12" fill="none" stroke="#e2c8a1" strokeWidth="1.1" />
      <circle cx="15" cy="9.5" r="1.2" fill="#cc3e32" />
      <path
        d={`M${width - 22} 20 C${width - 7} 18 ${width - 8} 6 ${width - 17} 8 C${width - 27} 10 ${width - 23} 18 ${width - 16} 15 C${width - 12} 13 ${width - 15} 10 ${width - 18} 12 M${width - 16} 15 L${width - 8} 10`}
        fill="none"
        stroke="#332b29"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx={width - 17} cy="11" r="1" fill="#d5a456" />
    </>
  );
}

function WarLongship({ width, id }: { width: number; id: string }) {
  const center = width / 2;
  const shields = Array.from({ length: 4 }, (_, index) => 21 + index * ((width - 42) / 3));
  const sailWidth = Math.min(42, width * 0.5);

  return (
    <>
      <ellipse cx={center} cy="32" rx={width / 2 - 12} ry="3.5" fill="rgba(0,0,0,.36)" />
      <path
        d={`M5 18 Q12 28 28 31 Q${center} 34 ${width - 25} 30 Q${width - 8} 26 ${width - 4} 17 Q${width - 19} 23 ${width - 32} 22 H31 Q15 23 5 18 Z`}
        fill={`url(#hull-war-${id})`}
        stroke="#30251d"
        strokeWidth="1.3"
      />
      <path
        d={`M5 18 Q12 25 23 25 M${width - 23} 25 Q${width - 10} 23 ${width - 4} 17`}
        fill="none"
        stroke="#c18d54"
        strokeWidth="1"
      />
      <line x1={center} y1="4" x2={center} y2="24" stroke="#3e2e22" strokeWidth="2" />
      <rect
        x={center - sailWidth / 2}
        y="4"
        width={sailWidth}
        height="15"
        rx="1"
        fill={`url(#sail-war-${id})`}
        stroke="#292725"
        strokeWidth="1"
      />
      {shields.map((x, index) => (
        <g key={x}>
          <circle
            cx={x}
            cy="22"
            r="4.4"
            fill={index % 2 === 0 ? '#315a79' : '#eee4ce'}
            stroke="#20252a"
            strokeWidth="1"
          />
          <circle cx={x} cy="22" r="1.1" fill={`url(#shield-boss-${id})`} />
        </g>
      ))}
      <path
        d="M17 19 C5 19 3 12 6 8 C8 5 13 7 12 10 C11 12 8 11 8 10 M8 17 Q15 17 19 20"
        fill="none"
        stroke="#e0c18b"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
      <circle cx="9" cy="9" r=".8" fill="#251b16" />
      <path
        d={`M${width - 18} 19 C${width - 8} 17 ${width - 8} 9 ${width - 15} 9 C${width - 21} 9 ${width - 21} 16 ${width - 15} 16 C${width - 12} 16 ${width - 12} 12 ${width - 15} 12`}
        fill="none"
        stroke="#cfaa70"
        strokeWidth="1.8"
      />
    </>
  );
}

function Raider({ width, id }: { width: number; id: string }) {
  const center = width / 2;
  const oars = Array.from({ length: 6 }, (_, index) => 22 + index * ((width - 44) / 5));

  return (
    <>
      <ellipse cx={center} cy="32" rx={width / 2 - 12} ry="3.5" fill="rgba(0,0,0,.3)" />
      <path
        d={`M8 21 Q13 27 30 30 Q${center} 32 ${width - 27} 29 Q${width - 9} 25 ${width - 5} 17 Q${width - 21} 22 ${width - 35} 22 H35 Q19 23 8 21 Z`}
        fill={`url(#hull-oak-${id})`}
        stroke="#59402a"
        strokeWidth="1.4"
      />
      <path
        d={`M25 26 Q${center} 28 ${width - 25} 26 M30 29 Q${center} 31 ${width - 30} 29`}
        fill="none"
        stroke="#725131"
        strokeWidth=".8"
      />
      {oars.map((x) => (
        <g key={x}>
          <path
            d={`M${x} 23 L${x - 5} 37`}
            stroke="#684a2e"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d={`M${x} 23 L${x + 5} 37`}
            stroke="#684a2e"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      ))}
      <line x1={center} y1="16" x2={center} y2="24" stroke="#4d3725" strokeWidth="2" />
      <path
        d="M18 21 Q8 19 5 13 Q11 14 15 10 Q21 10 22 15 L18 18 Q23 19 25 22"
        fill="#9b6d42"
        stroke="#422f22"
        strokeWidth="1.2"
      />
      <path d="M8 15 Q15 16 21 20" fill="none" stroke="#ead1a0" strokeWidth="1" />
      <circle cx="15" cy="13" r="1" fill="#261d18" />
      <path
        d={`M${width - 21} 21 C${width - 10} 20 ${width - 6} 14 ${width - 11} 12 C${width - 17} 10 ${width - 20} 16 ${width - 15} 18`}
        fill="none"
        stroke="#775033"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  );
}

function ScoutShip({ width, id }: { width: number; id: string }) {
  const center = width / 2;
  const sailWidth = 27;

  return (
    <>
      <ellipse cx={center} cy="32" rx={width / 2 - 11} ry="3" fill="rgba(0,0,0,.32)" />
      <path
        d={`M9 19 Q12 28 ${center - 8} 30 Q${center} 32 ${center + 8} 30 Q${width - 12} 28 ${width - 9} 19 Q${width - 17} 23 ${width - 25} 22 H25 Q17 23 9 19 Z`}
        fill={`url(#hull-oak-${id})`}
        stroke="#62472e"
        strokeWidth="1.4"
      />
      <path d={`M${center - 7} 27 Q${center} 29 ${center + 7} 27`} fill="none" stroke="#805b37" />
      <line
        x1={center - 7}
        y1="23"
        x2={center - 13}
        y2="35"
        stroke="#775638"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <line
        x1={center + 7}
        y1="23"
        x2={center + 13}
        y2="35"
        stroke="#775638"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <line x1={center} y1="7" x2={center} y2="24" stroke="#533c27" strokeWidth="1.8" />
      <path
        d={`M${center - sailWidth / 2} 8 Q${center - 2} 6 ${center} 8 V21 H${center - sailWidth / 2} Z`}
        fill={`url(#sail-scout-${id})`}
        stroke="#513b29"
        strokeWidth="1"
      />
      <path
        d="M19 20 Q11 18 9 12 Q14 14 17 10 M19 20 Q13 22 10 19 M10 13 Q14 14 17 13"
        fill="none"
        stroke="#ad7f4c"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d={`M${width - 19} 20 Q${width - 11} 18 ${width - 9} 12 Q${width - 14} 14 ${width - 17} 10 M${width - 19} 20 Q${width - 13} 22 ${width - 10} 19`}
        fill="none"
        stroke="#ad7f4c"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </>
  );
}
