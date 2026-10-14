import { formatCoord, getShip, type LogEntry, type ShipId } from '../engine';

const name = (id: ShipId) => getShip(id).name;

/** Norse narrative text for each structured log event. */
export function describeEvent(entry: LogEntry): string {
  switch (entry.kind) {
    case 'battleStart':
      return 'The war horns sound. Battle is joined!';
    case 'gameOver':
      return entry.winner === 'player'
        ? 'Victory! The enemy fleet has fallen.'
        : 'Defeat. Your fleet rests beneath the waves.';
    case 'shot': {
      const at = formatCoord(entry.coord);
      if (entry.attacker === 'player') {
        if (entry.sunk) return `Enemy ${name(entry.sunk)} sunk at ${at}!`;
        if (entry.result === 'hit') return `Your fleet struck an enemy vessel at ${at}!`;
        return `Your volley falls into the sea at ${at}.`;
      }
      if (entry.sunk) return `Your ${name(entry.sunk)} has been sunk at ${at}!`;
      if (entry.result === 'hit') return `The enemy struck your fleet at ${at}!`;
      return `Enemy attack missed at ${at}.`;
    }
  }
}

export type EventTone = 'neutral' | 'good' | 'bad';

export function eventTone(entry: LogEntry): EventTone {
  if (entry.kind === 'battleStart') return 'neutral';
  if (entry.kind === 'gameOver') return entry.winner === 'player' ? 'good' : 'bad';
  if (entry.result === 'miss') return 'neutral';
  return entry.attacker === 'player' ? 'good' : 'bad';
}

export const PLACEMENT_ERRORS = {
  outOfBounds: (ship: string) => `The ${ship} would run aground off the edge of your waters.`,
  overlap: (ship: string, other: string) => `The ${ship} would collide with your ${other}.`,
  alreadyPlaced: (ship: string) => `The ${ship} is already moored.`,
} as const;
