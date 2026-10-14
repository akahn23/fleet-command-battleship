import { BOARD_SIZE, type Coord } from './types';

export const COLUMN_LABELS = 'ABCDEFGHIJ'.split('');

export function isInBounds({ row, col }: Coord): boolean {
  return (
    Number.isInteger(row) &&
    Number.isInteger(col) &&
    row >= 0 &&
    row < BOARD_SIZE &&
    col >= 0 &&
    col < BOARD_SIZE
  );
}

export function sameCoord(a: Coord, b: Coord): boolean {
  return a.row === b.row && a.col === b.col;
}

/** "A1" … "J10": column letter, then 1-based row. */
export function formatCoord({ row, col }: Coord): string {
  return `${COLUMN_LABELS[col] ?? '?'}${row + 1}`;
}

export function allCoords(): Coord[] {
  const coords: Coord[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) coords.push({ row, col });
  }
  return coords;
}
