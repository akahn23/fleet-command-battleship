import type { Rng } from '../rng';
import type { Coord } from '../types';
import type { TargetingStrategy } from './randomAI';
import type { TargetingView } from './targetingView';

/** Hunts by the shortest remaining ship's parity and follows unresolved hits. */
export const huntTargetAI: TargetingStrategy = (view: TargetingView, rng: Rng): Coord => {
  const cells = view.cells;
  const cellAt = (row: number, col: number) =>
    row < 0 || row >= cells.length || col < 0 || col >= (cells[row]?.length ?? 0)
      ? undefined
      : cells[row]?.[col];
  const hits: Coord[] = [];
  const seen = new Set<string>();
  const addUnknown = (targets: Coord[], row: number, col: number) => {
    if (cellAt(row, col) !== 'unknown') return;
    const key = `${row},${col}`;
    if (seen.has(key)) return;
    seen.add(key);
    targets.push({ row, col });
  };

  cells.forEach((line, row) =>
    line.forEach((cell, col) => {
      if (cell === 'hit') hits.push({ row, col });
    }),
  );

  if (hits.length > 0) {
    const continuations: Coord[] = [];
    const directions: readonly (readonly [number, number])[] = [
      [0, 1],
      [1, 0],
    ];
    for (const { row, col } of hits) {
      for (const [rowStep, colStep] of directions) {
        if (cellAt(row - rowStep, col - colStep) === 'hit') continue;
        let endRow = row;
        let endCol = col;
        while (cellAt(endRow + rowStep, endCol + colStep) === 'hit') {
          endRow += rowStep;
          endCol += colStep;
        }
        if (endRow !== row || endCol !== col) {
          addUnknown(continuations, row - rowStep, col - colStep);
          addUnknown(continuations, endRow + rowStep, endCol + colStep);
        }
      }
    }
    if (continuations.length > 0) return rng.pick(continuations);

    const neighbours: Coord[] = [];
    for (const { row, col } of hits) {
      addUnknown(neighbours, row - 1, col);
      addUnknown(neighbours, row + 1, col);
      addUnknown(neighbours, row, col - 1);
      addUnknown(neighbours, row, col + 1);
    }
    if (neighbours.length > 0) return rng.pick(neighbours);
  }

  const minLen = Math.min(...view.remainingShipLengths);
  const parityTargets: Coord[] = [];
  const unknown: Coord[] = [];
  cells.forEach((line, row) =>
    line.forEach((cell, col) => {
      if (cell !== 'unknown') return;
      const coord = { row, col };
      unknown.push(coord);
      if ((row + col) % minLen === 0) parityTargets.push(coord);
    }),
  );
  return rng.pick(parityTargets.length > 0 ? parityTargets : unknown);
};
