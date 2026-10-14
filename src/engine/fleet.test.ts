import { FLEET, TOTAL_SHIP_CELLS, getShip } from './fleet';

describe('fleet', () => {
  it('has exactly five ships with standard lengths 5, 4, 3, 3, 2', () => {
    expect(FLEET).toHaveLength(5);
    expect(FLEET.map((s) => s.length)).toEqual([5, 4, 3, 3, 2]);
    expect(TOTAL_SHIP_CELLS).toBe(17);
  });

  it('uses the Viking class names with unique ids', () => {
    expect(FLEET.map((s) => s.name)).toEqual([
      'Great Longship',
      'Dragonship',
      'War Longship',
      'Raider',
      'Scout Ship',
    ]);
    expect(new Set(FLEET.map((s) => s.id)).size).toBe(5);
  });

  it('looks ships up by id', () => {
    expect(getShip('dragonship').length).toBe(4);
  });
});
