import {
  canPlaceShip,
  emptyBoard,
  isFleetComplete,
  isFleetDestroyed,
  isShipSunk,
  placeShip,
  receiveShot,
  removeShip,
  shipCells,
} from './board';
import { ROW_FLEET } from './testUtils';
import type { Board, ShipPlacement } from './types';

const H = (shipId: ShipPlacement['shipId'], row: number, col: number): ShipPlacement => ({
  shipId,
  origin: { row, col },
  orientation: 'horizontal',
});
const V = (shipId: ShipPlacement['shipId'], row: number, col: number): ShipPlacement => ({
  shipId,
  origin: { row, col },
  orientation: 'vertical',
});

describe('shipCells', () => {
  it('extends rightward when horizontal', () => {
    expect(shipCells(H('dragonship', 3, 2))).toEqual([
      { row: 3, col: 2 },
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 3, col: 5 },
    ]);
  });

  it('extends downward when vertical', () => {
    expect(shipCells(V('scoutShip', 7, 9))).toEqual([
      { row: 7, col: 9 },
      { row: 8, col: 9 },
    ]);
  });
});

describe('canPlaceShip', () => {
  const empty = emptyBoard();

  it('accepts ships that end exactly on the last row or column', () => {
    expect(canPlaceShip(empty, H('greatLongship', 0, 5))).toEqual({ ok: true });
    expect(canPlaceShip(empty, V('greatLongship', 5, 0))).toEqual({ ok: true });
    expect(canPlaceShip(empty, H('scoutShip', 9, 8))).toEqual({ ok: true });
  });

  it('rejects ships that run off any edge', () => {
    expect(canPlaceShip(empty, H('greatLongship', 0, 6))).toMatchObject({
      reason: 'outOfBounds',
    });
    expect(canPlaceShip(empty, V('greatLongship', 6, 0))).toMatchObject({
      reason: 'outOfBounds',
    });
    expect(canPlaceShip(empty, H('scoutShip', -1, 0))).toMatchObject({ reason: 'outOfBounds' });
    expect(canPlaceShip(empty, H('scoutShip', 0, -1))).toMatchObject({ reason: 'outOfBounds' });
    expect(canPlaceShip(empty, V('scoutShip', 10, 0))).toMatchObject({ reason: 'outOfBounds' });
  });

  it('rejects overlapping ships and names the conflict', () => {
    const board = placeShip(empty, H('dragonship', 4, 2))!;
    expect(canPlaceShip(board, V('raider', 2, 4))).toEqual({
      ok: false,
      reason: 'overlap',
      conflictsWith: 'dragonship',
    });
  });

  it('allows ships to touch side-by-side and end-to-end', () => {
    let board = placeShip(empty, H('dragonship', 4, 2))!;
    expect(canPlaceShip(board, H('raider', 5, 2))).toEqual({ ok: true }); // directly below
    expect(canPlaceShip(board, H('raider', 4, 6))).toEqual({ ok: true }); // right after the stern
    board = placeShip(board, H('raider', 5, 2))!;
    expect(canPlaceShip(board, V('scoutShip', 2, 2))).toEqual({ ok: true }); // above the bow
  });

  it('rejects placing the same ship twice', () => {
    const board = placeShip(empty, H('raider', 0, 0))!;
    expect(canPlaceShip(board, H('raider', 5, 5))).toMatchObject({ reason: 'alreadyPlaced' });
  });
});

describe('placeShip / removeShip', () => {
  it('returns a new board and leaves the original untouched', () => {
    const empty = emptyBoard();
    const board = placeShip(empty, H('raider', 0, 0));
    expect(board?.ships).toHaveLength(1);
    expect(empty.ships).toHaveLength(0);
  });

  it('returns null for invalid placements or removals', () => {
    expect(placeShip(emptyBoard(), H('greatLongship', 0, 9))).toBeNull();
    expect(removeShip(emptyBoard(), 'raider')).toBeNull();
  });

  it('removes a placed ship', () => {
    const board = placeShip(emptyBoard(), H('raider', 0, 0))!;
    expect(removeShip(board, 'raider')?.ships).toEqual([]);
  });

  it('knows when all five ships are placed', () => {
    expect(isFleetComplete({ ships: ROW_FLEET.slice(0, 4), shots: [] })).toBe(false);
    expect(isFleetComplete({ ships: ROW_FLEET, shots: [] })).toBe(true);
  });
});

describe('receiveShot', () => {
  const board: Board = { ships: ROW_FLEET, shots: [] };

  it('records a miss on open water', () => {
    const outcome = receiveShot(board, { row: 1, col: 0 })!;
    expect(outcome.shot).toEqual({ coord: { row: 1, col: 0 }, result: 'miss' });
    expect(outcome.sunk).toBeUndefined();
    expect(board.shots).toHaveLength(0);
  });

  it('records a hit with the ship struck', () => {
    const outcome = receiveShot(board, { row: 2, col: 3 })!;
    expect(outcome.shot).toMatchObject({ result: 'hit', shipId: 'dragonship' });
    expect(outcome.sunk).toBeUndefined();
  });

  it('reports a ship sunk only when its last cell is hit', () => {
    const first = receiveShot(board, { row: 8, col: 0 })!;
    expect(first.sunk).toBeUndefined();
    expect(isShipSunk(first.board, 'scoutShip')).toBe(false);
    const second = receiveShot(first.board, { row: 8, col: 1 })!;
    expect(second.sunk).toBe('scoutShip');
    expect(isShipSunk(second.board, 'scoutShip')).toBe(true);
  });

  it('rejects repeated and out-of-bounds shots', () => {
    const after = receiveShot(board, { row: 5, col: 5 })!.board;
    expect(receiveShot(after, { row: 5, col: 5 })).toBeNull();
    expect(receiveShot(board, { row: 10, col: 0 })).toBeNull();
  });

  it('detects a destroyed fleet only after all 17 cells are hit', () => {
    let b = board;
    const cells = ROW_FLEET.flatMap(shipCells);
    cells.forEach((cell, i) => {
      expect(isFleetDestroyed(b)).toBe(false);
      b = receiveShot(b, cell)!.board;
      if (i === cells.length - 1) expect(isFleetDestroyed(b)).toBe(true);
    });
    expect(isFleetDestroyed(emptyBoard())).toBe(false);
  });
});
