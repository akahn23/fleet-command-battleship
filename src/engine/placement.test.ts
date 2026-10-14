import { isInBounds } from './coords';
import { shipCells } from './board';
import { FLEET } from './fleet';
import { randomFleet } from './placement';
import { Rng } from './rng';

describe('randomFleet', () => {
  it('always produces a complete, legal fleet (1,000 seeds)', () => {
    const orientations = new Set<string>();
    for (let seed = 0; seed < 1000; seed++) {
      const ships = randomFleet(new Rng(seed));
      expect(ships.map((s) => s.shipId)).toEqual(FLEET.map((s) => s.id));
      const cells = ships.flatMap(shipCells);
      expect(cells).toHaveLength(17);
      expect(cells.every(isInBounds)).toBe(true);
      expect(new Set(cells.map((c) => `${c.row},${c.col}`)).size).toBe(17);
      ships.forEach((s) => orientations.add(s.orientation));
    }
    expect(orientations).toEqual(new Set(['horizontal', 'vertical']));
  });

  it('is reproducible from a seed and varies between seeds', () => {
    expect(randomFleet(new Rng(99))).toEqual(randomFleet(new Rng(99)));
    expect(randomFleet(new Rng(99))).not.toEqual(randomFleet(new Rng(100)));
  });
});
