import { allCoords, formatCoord, isInBounds } from './coords';

describe('coords', () => {
  it('formats as column letter then 1-based row', () => {
    expect(formatCoord({ row: 0, col: 0 })).toBe('A1');
    expect(formatCoord({ row: 9, col: 9 })).toBe('J10');
    expect(formatCoord({ row: 6, col: 3 })).toBe('D7');
  });

  it('accepts only integer coordinates 0-9', () => {
    expect(isInBounds({ row: 0, col: 9 })).toBe(true);
    expect(isInBounds({ row: 10, col: 0 })).toBe(false);
    expect(isInBounds({ row: -1, col: 0 })).toBe(false);
    expect(isInBounds({ row: 0, col: 10 })).toBe(false);
    expect(isInBounds({ row: 1.5, col: 0 })).toBe(false);
  });

  it('enumerates all 100 cells', () => {
    expect(allCoords()).toHaveLength(100);
  });
});
