import { createGame } from './game';
import type { GameState, ShipPlacement } from './types';

/** Five horizontal ships on rows 0, 2, 4, 6, 8, starting at column A. */
export const ROW_FLEET: ShipPlacement[] = [
  { shipId: 'greatLongship', origin: { row: 0, col: 0 }, orientation: 'horizontal' },
  { shipId: 'dragonship', origin: { row: 2, col: 0 }, orientation: 'horizontal' },
  { shipId: 'warLongship', origin: { row: 4, col: 0 }, orientation: 'horizontal' },
  { shipId: 'raider', origin: { row: 6, col: 0 }, orientation: 'horizontal' },
  { shipId: 'scoutShip', origin: { row: 8, col: 0 }, orientation: 'horizontal' },
];

/** Five vertical ships in columns A, C, E, G, I, starting at row 1 (index 0). */
export const COLUMN_FLEET: ShipPlacement[] = ROW_FLEET.map((ship, i) => ({
  ...ship,
  origin: { row: 0, col: i * 2 },
  orientation: 'vertical',
}));

/** A game already in battle, with known fleets on both sides. */
export function battleState(
  playerShips: ShipPlacement[] = ROW_FLEET,
  computerShips: ShipPlacement[] = COLUMN_FLEET,
  seed = 42,
): GameState {
  const game = createGame({ seed });
  return {
    ...game,
    phase: 'battle',
    turn: 'player',
    boards: {
      player: { ships: playerShips, shots: [] },
      computer: { ships: computerShips, shots: [] },
    },
  };
}
