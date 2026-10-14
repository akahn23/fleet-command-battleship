export const BOARD_SIZE = 10;

export interface Coord {
  row: number;
  col: number;
}

export type Orientation = 'horizontal' | 'vertical';

export type ShipId = 'greatLongship' | 'dragonship' | 'warLongship' | 'raider' | 'scoutShip';

export interface ShipDefinition {
  id: ShipId;
  name: string;
  length: number;
}

export interface ShipPlacement {
  shipId: ShipId;
  /** The bow: leftmost cell if horizontal, topmost if vertical. */
  origin: Coord;
  orientation: Orientation;
}

export type ShotResult = 'miss' | 'hit';

export interface Shot {
  coord: Coord;
  result: ShotResult;
  shipId?: ShipId;
}

/** One side's waters: its own ships and the shots it has received. */
export interface Board {
  ships: ShipPlacement[];
  shots: Shot[];
}

export type Side = 'player' | 'computer';

export type Phase = 'placement' | 'battle' | 'gameOver';

export type LogEvent =
  | { kind: 'battleStart' }
  | { kind: 'shot'; attacker: Side; coord: Coord; result: ShotResult; sunk?: ShipId }
  | { kind: 'gameOver'; winner: Side };

export type LogEntry = LogEvent & { id: number };

export interface GameState {
  gameId: number;
  phase: Phase;
  turn: Side;
  boards: Record<Side, Board>;
  winner: Side | null;
  log: LogEntry[];
  rngState: number;
}

export type PlacementError = 'outOfBounds' | 'overlap' | 'alreadyPlaced';

export type PlacementCheck =
  { ok: true } | { ok: false; reason: PlacementError; conflictsWith?: ShipId };
