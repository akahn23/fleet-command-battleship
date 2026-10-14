import { useRef, useState, type KeyboardEvent } from 'react';
import {
  BOARD_SIZE,
  COLUMN_LABELS,
  isShipSunk,
  type Board as BoardModel,
  type Coord,
  type ShipPlacement,
  type Shot,
} from '../../engine';
import { ShipSprite } from '../ships/ShipSprite';
import { Marker } from './Marker';
import './Board.css';

export type CellState = 'open' | 'miss' | 'hit' | 'sunk';

export interface BoardPreview {
  cells: Coord[];
  valid: boolean;
}

interface BoardProps {
  /** Accessible name, e.g. "Enemy waters". */
  title: string;
  testId: string;
  board: BoardModel;
  ships: ShipPlacement[];
  ghostShips?: ShipPlacement[];
  preview?: BoardPreview | null;
  /** Whether cell clicks are currently meaningful (e.g. it's the player's turn). */
  active: boolean;
  describeCell: (coord: Coord, state: CellState) => string;
  isCellUnavailable?: (state: CellState) => boolean;
  onCellActivate?: (coord: Coord) => void;
  onCellHover?: (coord: Coord | null) => void;
}

const key = ({ row, col }: Coord) => row * BOARD_SIZE + col;
const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

function cellState(board: BoardModel, shot: Shot | undefined): CellState {
  if (!shot) return 'open';
  if (shot.result === 'miss') return 'miss';
  return shot.shipId && isShipSunk(board, shot.shipId) ? 'sunk' : 'hit';
}

export function Board({
  title,
  testId,
  board,
  ships,
  ghostShips = [],
  preview,
  active,
  describeCell,
  isCellUnavailable = () => false,
  onCellActivate,
  onCellHover,
}: BoardProps) {
  const [focusKey, setFocusKey] = useState(0);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const shots = new Map(board.shots.map((shot) => [key(shot.coord), shot]));
  const previewKeys = new Set(preview?.cells.map(key));

  const moveFocus = (event: KeyboardEvent, coord: Coord) => {
    const delta = ARROWS[event.key];
    if (!delta) return;
    event.preventDefault();
    const row = Math.min(BOARD_SIZE - 1, Math.max(0, coord.row + delta[0]));
    const col = Math.min(BOARD_SIZE - 1, Math.max(0, coord.col + delta[1]));
    const next = key({ row, col });
    setFocusKey(next);
    cellRefs.current[next]?.focus();
  };

  return (
    <div className={`board-frame${active ? ' board-frame--active' : ''}`}>
      <div
        className="board"
        role="group"
        aria-label={title}
        data-testid={testId}
        onMouseLeave={() => onCellHover?.(null)}
      >
        <div className="board__water" aria-hidden="true" />
        {COLUMN_LABELS.map((label, col) => (
          <span key={label} className="board__label" style={{ gridRow: 1, gridColumn: col + 2 }}>
            {label}
          </span>
        ))}
        {Array.from({ length: BOARD_SIZE }, (_, row) => (
          <span key={row} className="board__label" style={{ gridRow: row + 2, gridColumn: 1 }}>
            {row + 1}
          </span>
        ))}

        {ghostShips.map((ship) => (
          <ShipSprite key={ship.shipId} placement={ship} variant="ghost" />
        ))}
        {ships.map((ship) => (
          <ShipSprite
            key={ship.shipId}
            placement={ship}
            variant={isShipSunk(board, ship.shipId) ? 'sunk' : 'afloat'}
          />
        ))}
        {[...shots.values()].map((shot) => {
          const state = cellState(board, shot);
          return state === 'open' ? null : (
            <Marker key={key(shot.coord)} coord={shot.coord} kind={state} />
          );
        })}

        {Array.from({ length: BOARD_SIZE * BOARD_SIZE }, (_, index) => {
          const coord = { row: Math.floor(index / BOARD_SIZE), col: index % BOARD_SIZE };
          const state = cellState(board, shots.get(index));
          const unavailable = !active || isCellUnavailable(state);
          const inPreview = previewKeys.has(index);
          const classes = ['cell'];
          if (inPreview) classes.push(preview?.valid ? 'cell--preview-ok' : 'cell--preview-bad');
          if (state !== 'open') classes.push(`cell--${state}`);
          return (
            <button
              key={index}
              ref={(el) => {
                cellRefs.current[index] = el;
              }}
              type="button"
              className={classes.join(' ')}
              style={{ gridRow: coord.row + 2, gridColumn: coord.col + 2 }}
              tabIndex={index === focusKey ? 0 : -1}
              aria-label={describeCell(coord, state)}
              aria-disabled={unavailable || undefined}
              data-row={coord.row}
              data-col={coord.col}
              data-state={state}
              onClick={() => {
                setFocusKey(index);
                if (!unavailable) onCellActivate?.(coord);
              }}
              onMouseEnter={() => onCellHover?.(coord)}
              onFocus={() => onCellHover?.(coord)}
              onKeyDown={(event) => moveFocus(event, coord)}
            />
          );
        })}
      </div>
    </div>
  );
}
