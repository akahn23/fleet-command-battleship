import { allCoords } from './coords';
import { canPlaceShip } from './board';
import { FLEET } from './fleet';
import type { Rng } from './rng';
import type { Board, Orientation, ShipPlacement } from './types';

const ORIENTATIONS: Orientation[] = ['horizontal', 'vertical'];

/**
 * Random valid fleet. Each ship (largest first) is chosen uniformly from every
 * legal position remaining, so it never needs to retry and always terminates.
 */
export function randomFleet(rng: Rng): ShipPlacement[] {
  let board: Board = { ships: [], shots: [] };
  for (const { id } of FLEET) {
    const options = allCoords().flatMap((origin) =>
      ORIENTATIONS.map((orientation): ShipPlacement => ({ shipId: id, origin, orientation })),
    );
    const legal = options.filter((p) => canPlaceShip(board, p).ok);
    board = { ...board, ships: [...board.ships, rng.pick(legal)] };
  }
  return board.ships;
}
