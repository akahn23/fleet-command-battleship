import { allCoords, isInBounds } from './coords';
import { shipCells } from './board';
import { FLEET } from './fleet';
import type { Rng } from './rng';
import { BOARD_SIZE, type Orientation, type ShipPlacement } from './types';

const ORIENTATIONS: Orientation[] = ['horizontal', 'vertical'];

/**
 * Random valid fleet. Each ship (largest first) is chosen uniformly from every
 * legal position remaining, so it never needs to retry and always terminates.
 */
export function randomFleet(rng: Rng): ShipPlacement[] {
  const ships: ShipPlacement[] = [];
  const occupied = new Set<number>();
  for (const { id } of FLEET) {
    const legal: { placement: ShipPlacement; keys: number[] }[] = [];
    for (const origin of allCoords()) {
      for (const orientation of ORIENTATIONS) {
        const placement: ShipPlacement = { shipId: id, origin, orientation };
        const cells = shipCells(placement);
        if (!cells.every(isInBounds)) continue;
        const keys = cells.map(({ row, col }) => row * BOARD_SIZE + col);
        if (keys.some((key) => occupied.has(key))) continue;
        legal.push({ placement, keys });
      }
    }
    const choice = rng.pick(legal);
    choice.keys.forEach((key) => occupied.add(key));
    ships.push(choice.placement);
  }
  return ships;
}
