import { useId } from 'react';
import { getShip, type ShipId, type ShipPlacement } from '../../engine';
import './ShipSprite.css';

/** The artwork uses 40-unit cells; each viewBox normalizes a ship to L × 1. */
const ART_UNITS_PER_CELL = 40;
const VIEW_UNITS_PER_CELL = 100;
const ART_SCALE = VIEW_UNITS_PER_CELL / ART_UNITS_PER_CELL;
const CROSS_AXIS_SCALE = 0.835;
const CROSS_AXIS_INSET = (VIEW_UNITS_PER_CELL * (1 - CROSS_AXIS_SCALE)) / 2;
const PATTERN_CELL = VIEW_UNITS_PER_CELL / 4;

export type ShipVariant = 'afloat' | 'sunk' | 'ghost';

interface ShipSpriteProps {
  placement: ShipPlacement;
  variant?: ShipVariant;
  revealSunk?: boolean;
}

/** A longship laid into the board's own grid, so it always covers exactly its cells. */
export function ShipSprite({ placement, variant = 'afloat', revealSunk = false }: ShipSpriteProps) {
  const { length } = getShip(placement.shipId);
  const vertical = placement.orientation === 'vertical';
  const { row, col } = placement.origin;
  const width = length * ART_UNITS_PER_CELL;
  const artworkTransform = vertical
    ? `translate(${CROSS_AXIS_INSET} 0) scale(${CROSS_AXIS_SCALE} 1) translate(${VIEW_UNITS_PER_CELL} 0) rotate(90) scale(${ART_SCALE})`
    : `translate(0 ${CROSS_AXIS_INSET}) scale(1 ${CROSS_AXIS_SCALE}) scale(${ART_SCALE})`;
  const id = useId().replace(/:/g, '');

  return (
    <div
      className={`ship ship--${placement.orientation} ship--${variant}${revealSunk ? ' ship--sunk-reveal' : ''}`}
      style={{
        gridRow: `${row + 2} / span ${vertical ? length : 1}`,
        gridColumn: `${col + 2} / span ${vertical ? 1 : length}`,
      }}
      data-testid={`ship-${placement.shipId}`}
      data-variant={variant}
      aria-hidden="true"
    >
      <svg
        viewBox={
          vertical
            ? `0 0 ${VIEW_UNITS_PER_CELL} ${length * VIEW_UNITS_PER_CELL}`
            : `0 0 ${length * VIEW_UNITS_PER_CELL} ${VIEW_UNITS_PER_CELL}`
        }
        preserveAspectRatio="xMidYMid meet"
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
          <pattern
            id={`sail-great-${id}`}
            width={PATTERN_CELL}
            height={PATTERN_CELL}
            patternUnits="userSpaceOnUse"
          >
            <rect width={PATTERN_CELL} height={PATTERN_CELL} fill="#e6d7b8" />
            <rect width={PATTERN_CELL / 2} height={PATTERN_CELL} fill="#a5322d" />
          </pattern>
          <pattern
            id={`sail-dragon-${id}`}
            width={PATTERN_CELL}
            height={PATTERN_CELL}
            patternUnits="userSpaceOnUse"
          >
            <rect width={PATTERN_CELL} height={PATTERN_CELL} fill="#201d20" />
            <rect width={PATTERN_CELL * 0.4} height={PATTERN_CELL} fill="#8d2028" />
          </pattern>
          <pattern
            id={`sail-war-${id}`}
            width={PATTERN_CELL}
            height={PATTERN_CELL}
            patternUnits="userSpaceOnUse"
          >
            <rect width={PATTERN_CELL} height={PATTERN_CELL} fill="#eee4ce" />
            <rect width={PATTERN_CELL / 2} height={PATTERN_CELL} fill="#315a79" />
          </pattern>
          <pattern
            id={`sail-scout-${id}`}
            width={PATTERN_CELL}
            height={PATTERN_CELL}
            patternUnits="userSpaceOnUse"
          >
            <rect width={PATTERN_CELL} height={PATTERN_CELL} fill="#d2a24f" />
            <rect width={PATTERN_CELL * 0.3} height={PATTERN_CELL} fill="#f0dfba" />
          </pattern>
        </defs>
        <g transform={artworkTransform} data-testid="artwork-bounds">
          <ShipArtwork shipId={placement.shipId} width={width} id={id} />
        </g>
      </svg>
      {variant === 'sunk' && <span className="ship__smoke" data-testid="sunk-smoke" />}
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
  const sailWidth = 45;
  const center = width / 2;

  return (
    <>
      <ellipse cx={center} cy="37" rx={width / 2 - 12} ry="2" fill="rgba(0,0,0,.36)" />
      <path
        d={`M4 16 Q8 29 25 33 Q${center} 37 ${width - 25} 33 Q${width - 8} 29 ${width - 4} 16 Q${width - 20} 21 ${width - 34} 18 H34 Q18 19 4 16 Z`}
        fill={`url(#hull-great-${id})`}
        stroke="var(--wood-dark)"
        strokeWidth="2"
      />
      {[25, 30, 34].map((y) => (
        <path
          key={y}
          d={`M16 ${y} Q${center} ${y + 2} ${width - 16} ${y}`}
          fill="none"
          stroke="rgba(27,17,11,.58)"
          strokeWidth="1.15"
        />
      ))}
      {shields.map((x, index) => (
        <g key={x}>
          <line
            x1={x}
            y1="24"
            x2={x - 3}
            y2="37"
            stroke="var(--wood-dark)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx={x} cy="19.5" r="6.5" fill={colors[index % colors.length]} stroke="#211b18" />
          <circle cx={x} cy="19.5" r="1.6" fill={`url(#shield-boss-${id})`} />
        </g>
      ))}
      <line x1={center} y1="2" x2={center} y2="28" stroke="#3d2b1d" strokeWidth="2.2" />
      <rect
        x={center - sailWidth / 2}
        y="2"
        width={sailWidth}
        height="25"
        rx="1"
        fill={`url(#sail-great-${id})`}
        stroke="#32251c"
        strokeWidth="1.4"
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
  const sailWidth = Math.min(54, width * 0.42);

  return (
    <>
      <ellipse cx={center} cy="37" rx={width / 2 - 13} ry="2" fill="rgba(0,0,0,.44)" />
      <path
        d={`M7 16 Q14 29 31 33 Q${center} 37 ${width - 28} 32 Q${width - 8} 28 ${width - 5} 15 Q${width - 23} 20 ${width - 38} 18 H34 Q18 19 7 16 Z`}
        fill={`url(#hull-tar-${id})`}
        stroke="#111214"
        strokeWidth="2.1"
      />
      {[26, 31, 35].map((y) => (
        <path
          key={y}
          d={`M24 ${y} Q${center} ${y + 1.5} ${width - 25} ${y}`}
          fill="none"
          stroke="#74685a"
          strokeWidth="1.1"
        />
      ))}
      <line x1={center} y1="1" x2={center} y2="29" stroke="#262123" strokeWidth="2.3" />
      <rect
        x={center - sailWidth / 2}
        y="1"
        width={sailWidth}
        height="28"
        rx="1"
        fill={`url(#sail-dragon-${id})`}
        stroke="#140f12"
        strokeWidth="1.4"
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
  const sailWidth = Math.min(48, width * 0.54);

  return (
    <>
      <ellipse cx={center} cy="37" rx={width / 2 - 12} ry="2" fill="rgba(0,0,0,.36)" />
      <path
        d={`M5 16 Q12 29 28 33 Q${center} 37 ${width - 25} 32 Q${width - 8} 28 ${width - 4} 15 Q${width - 19} 20 ${width - 32} 18 H31 Q15 19 5 16 Z`}
        fill={`url(#hull-war-${id})`}
        stroke="#30251d"
        strokeWidth="2"
      />
      <path
        d={`M5 16 Q12 26 23 27 M${width - 23} 27 Q${width - 10} 25 ${width - 4} 15`}
        fill="none"
        stroke="#c18d54"
        strokeWidth="1"
      />
      <line x1={center} y1="2" x2={center} y2="29" stroke="#3e2e22" strokeWidth="2.2" />
      <rect
        x={center - sailWidth / 2}
        y="2"
        width={sailWidth}
        height="24"
        rx="1"
        fill={`url(#sail-war-${id})`}
        stroke="#292725"
        strokeWidth="1.4"
      />
      {shields.map((x, index) => (
        <g key={x}>
          <circle
            cx={x}
            cy="20.5"
            r="6.5"
            fill={index % 2 === 0 ? '#315a79' : '#eee4ce'}
            stroke="#20252a"
            strokeWidth="1"
          />
          <circle cx={x} cy="20.5" r="1.6" fill={`url(#shield-boss-${id})`} />
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
      <ellipse cx={center} cy="37" rx={width / 2 - 12} ry="2" fill="rgba(0,0,0,.3)" />
      <path
        d={`M8 17 Q13 29 30 33 Q${center} 37 ${width - 27} 32 Q${width - 9} 28 ${width - 5} 15 Q${width - 21} 19 ${width - 35} 18 H35 Q19 19 8 17 Z`}
        fill={`url(#hull-oak-${id})`}
        stroke="#59402a"
        strokeWidth="2"
      />
      <path
        d={`M25 28 Q${center} 30 ${width - 25} 28 M30 32 Q${center} 34 ${width - 30} 32`}
        fill="none"
        stroke="#725131"
        strokeWidth="1.2"
      />
      {oars.map((x) => (
        <g key={x}>
          <path
            d={`M${x} 24 L${x - 5} 39`}
            stroke="#684a2e"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
          <path
            d={`M${x} 24 L${x + 5} 39`}
            stroke="#684a2e"
            strokeWidth="1.9"
            strokeLinecap="round"
          />
        </g>
      ))}
      <line x1={center} y1="6" x2={center} y2="28" stroke="#4d3725" strokeWidth="2.4" />
      <path
        d="M18 18 Q8 16 5 10 Q11 11 15 7 Q21 7 22 12 L18 15 Q23 16 25 19"
        fill="#9b6d42"
        stroke="#422f22"
        strokeWidth="1.2"
      />
      <path d="M8 12 Q15 13 21 17" fill="none" stroke="#ead1a0" strokeWidth="1" />
      <circle cx="15" cy="10" r="1" fill="#261d18" />
      <path
        d={`M${width - 21} 18 C${width - 10} 17 ${width - 6} 11 ${width - 11} 9 C${width - 17} 7 ${width - 20} 13 ${width - 15} 15`}
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
  const sailWidth = 33;

  return (
    <>
      <ellipse cx={center} cy="37" rx={width / 2 - 11} ry="2" fill="rgba(0,0,0,.32)" />
      <path
        d={`M9 16 Q12 29 ${center - 8} 33 Q${center} 37 ${center + 8} 33 Q${width - 12} 29 ${width - 9} 16 Q${width - 17} 20 ${width - 25} 18 H25 Q17 19 9 16 Z`}
        fill={`url(#hull-oak-${id})`}
        stroke="#62472e"
        strokeWidth="2"
      />
      <path d={`M${center - 7} 27 Q${center} 29 ${center + 7} 27`} fill="none" stroke="#805b37" />
      <line
        x1={center - 7}
        y1="24"
        x2={center - 13}
        y2="38"
        stroke="#775638"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line
        x1={center + 7}
        y1="24"
        x2={center + 13}
        y2="38"
        stroke="#775638"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <line x1={center} y1="3" x2={center} y2="29" stroke="#533c27" strokeWidth="2.2" />
      <path
        d={`M${center - sailWidth / 2} 3 Q${center - 2} 1 ${center} 3 V26 H${center - sailWidth / 2} Z`}
        fill={`url(#sail-scout-${id})`}
        stroke="#513b29"
        strokeWidth="1.4"
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
