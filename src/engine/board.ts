import { isInBounds, sameCoord } from './coords';
import { FLEET, getShip } from './fleet';
import type { Board, Coord, PlacementCheck, ShipId, ShipPlacement, Shot } from './types';

export const emptyBoard = (): Board => ({ ships: [], shots: [] });

export function shipCells({ shipId, origin, orientation }: ShipPlacement): Coord[] {
  const { length } = getShip(shipId);
  return Array.from({ length }, (_, i) =>
    orientation === 'horizontal'
      ? { row: origin.row, col: origin.col + i }
      : { row: origin.row + i, col: origin.col },
  );
}

export function shipAt(board: Board, coord: Coord): ShipPlacement | undefined {
  return board.ships.find((ship) => shipCells(ship).some((cell) => sameCoord(cell, coord)));
}

export function canPlaceShip(board: Board, placement: ShipPlacement): PlacementCheck {
  if (board.ships.some((ship) => ship.shipId === placement.shipId)) {
    return { ok: false, reason: 'alreadyPlaced' };
  }
  const cells = shipCells(placement);
  if (!cells.every(isInBounds)) return { ok: false, reason: 'outOfBounds' };
  for (const cell of cells) {
    const other = shipAt(board, cell);
    if (other) return { ok: false, reason: 'overlap', conflictsWith: other.shipId };
  }
  return { ok: true };
}

/** Returns a new board with the ship added, or `null` if the placement is invalid. */
export function placeShip(board: Board, placement: ShipPlacement): Board | null {
  if (!canPlaceShip(board, placement).ok) return null;
  return { ...board, ships: [...board.ships, placement] };
}

export function removeShip(board: Board, shipId: ShipId): Board | null {
  if (!board.ships.some((ship) => ship.shipId === shipId)) return null;
  return { ...board, ships: board.ships.filter((ship) => ship.shipId !== shipId) };
}

export function isFleetComplete(board: Board): boolean {
  return FLEET.every((def) => board.ships.some((ship) => ship.shipId === def.id));
}

export function shotAt(board: Board, coord: Coord): Shot | undefined {
  return board.shots.find((shot) => sameCoord(shot.coord, coord));
}

export function isShipSunk(board: Board, shipId: ShipId): boolean {
  const ship = board.ships.find((s) => s.shipId === shipId);
  if (!ship) return false;
  return shipCells(ship).every((cell) => shotAt(board, cell)?.result === 'hit');
}

export function sunkShips(board: Board): ShipPlacement[] {
  return board.ships.filter((ship) => isShipSunk(board, ship.shipId));
}

export function isFleetDestroyed(board: Board): boolean {
  return board.ships.length > 0 && board.ships.every((ship) => isShipSunk(board, ship.shipId));
}

export interface ShotOutcome {
  board: Board;
  shot: Shot;
  sunk?: ShipId;
}

/** Resolves a shot against this board. Returns `null` for out-of-bounds or repeated shots. */
export function receiveShot(board: Board, coord: Coord): ShotOutcome | null {
  if (!isInBounds(coord) || shotAt(board, coord)) return null;
  const target = shipAt(board, coord);
  const shot: Shot = target
    ? { coord: { ...coord }, result: 'hit', shipId: target.shipId }
    : { coord: { ...coord }, result: 'miss' };
  const next: Board = { ...board, shots: [...board.shots, shot] };
  const sunk = target && isShipSunk(next, target.shipId) ? target.shipId : undefined;
  return sunk ? { board: next, shot, sunk } : { board: next, shot };
}
