import { shipCells, sunkShips } from '../board';
import { BOARD_SIZE, type Board } from '../types';
import { FLEET } from '../fleet';

export type CellKnowledge = 'unknown' | 'miss' | 'hit' | 'sunk';

/**
 * Everything an attacker is legitimately allowed to know about the defender's
 * waters: the outcome of its own past shots, which hits belong to sunk ships,
 * and the lengths of ships still afloat. Ship positions are deliberately absent.
 */
export interface TargetingView {
  readonly cells: readonly (readonly CellKnowledge[])[];
  readonly remainingShipLengths: readonly number[];
}

export function buildTargetingView(defender: Board): TargetingView {
  const sunk = sunkShips(defender);
  const sunkCells = new Set(sunk.flatMap(shipCells).map(({ row, col }) => row * BOARD_SIZE + col));
  const shots = new Map(defender.shots.map((s) => [s.coord.row * BOARD_SIZE + s.coord.col, s]));
  const cells = Array.from({ length: BOARD_SIZE }, (_, row) =>
    Array.from({ length: BOARD_SIZE }, (_, col): CellKnowledge => {
      const shot = shots.get(row * BOARD_SIZE + col);
      if (!shot) return 'unknown';
      if (shot.result === 'miss') return 'miss';
      return sunkCells.has(row * BOARD_SIZE + col) ? 'sunk' : 'hit';
    }),
  );
  const sunkIds = new Set(sunk.map((s) => s.shipId));
  const remainingShipLengths = FLEET.filter((s) => !sunkIds.has(s.id)).map((s) => s.length);
  return { cells, remainingShipLengths };
}
