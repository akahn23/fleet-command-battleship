import { receiveShot } from '../board';
import { COLUMN_FLEET, ROW_FLEET } from '../testUtils';
import type { Board, Coord } from '../types';
import { buildTargetingView } from './targetingView';

function shoot(board: Board, coords: Coord[]): Board {
  return coords.reduce((b, c) => receiveShot(b, c)!.board, board);
}

describe('buildTargetingView', () => {
  it('starts as a 10x10 grid of unknown cells with all five ships afloat', () => {
    const view = buildTargetingView({ ships: ROW_FLEET, shots: [] });
    expect(view.cells).toHaveLength(10);
    view.cells.forEach((row) => expect(row).toEqual(Array(10).fill('unknown')));
    expect(view.remainingShipLengths).toEqual([5, 4, 3, 3, 2]);
  });

  it('reflects misses, hits, and sunk ships', () => {
    const board = shoot({ ships: ROW_FLEET, shots: [] }, [
      { row: 1, col: 1 }, // miss
      { row: 2, col: 0 }, // dragonship hit
      { row: 8, col: 0 }, // scout ship...
      { row: 8, col: 1 }, // ...sunk
    ]);
    const view = buildTargetingView(board);
    expect(view.cells[1]?.[1]).toBe('miss');
    expect(view.cells[2]?.[0]).toBe('hit');
    expect(view.cells[8]?.[0]).toBe('sunk');
    expect(view.cells[8]?.[1]).toBe('sunk');
    expect(view.cells[0]?.[0]).toBe('unknown'); // un-shot ship cell stays unknown
    expect(view.remainingShipLengths).toEqual([5, 4, 3, 3]);
  });

  it('contains no ship positions: different fleets with the same shot outcomes look identical', () => {
    // Squares that are open water for both ROW_FLEET and COLUMN_FLEET.
    const misses: Coord[] = [
      { row: 9, col: 9 },
      { row: 7, col: 5 },
      { row: 5, col: 9 },
    ];
    const a = buildTargetingView(shoot({ ships: ROW_FLEET, shots: [] }, misses));
    const b = buildTargetingView(shoot({ ships: COLUMN_FLEET, shots: [] }, misses));
    expect(a).toEqual(b);
    expect(Object.keys(a).sort()).toEqual(['cells', 'remainingShipLengths']);
    expect(JSON.stringify(a)).not.toMatch(/origin|shipId|orientation/);
  });
});
