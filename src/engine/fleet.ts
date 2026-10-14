import type { ShipDefinition, ShipId } from './types';

/** Standard Battleship fleet with Viking classes, largest first. */
export const FLEET: readonly ShipDefinition[] = [
  { id: 'greatLongship', name: 'Great Longship', length: 5 },
  { id: 'dragonship', name: 'Dragonship', length: 4 },
  { id: 'warLongship', name: 'War Longship', length: 3 },
  { id: 'raider', name: 'Raider', length: 3 },
  { id: 'scoutShip', name: 'Scout Ship', length: 2 },
];

export const TOTAL_SHIP_CELLS = FLEET.reduce((sum, ship) => sum + ship.length, 0);

const BY_ID = new Map(FLEET.map((ship) => [ship.id, ship]));

export function getShip(id: ShipId): ShipDefinition {
  const ship = BY_ID.get(id);
  if (!ship) throw new Error(`Unknown ship: ${id}`);
  return ship;
}
