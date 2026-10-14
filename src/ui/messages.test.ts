import { describeEvent, eventTone } from './messages';

const at = { row: 6, col: 3 }; // D7

describe('battle log messages', () => {
  it('describes player shots', () => {
    expect(
      describeEvent({ id: 1, kind: 'shot', attacker: 'player', coord: at, result: 'miss' }),
    ).toBe('Your volley falls into the sea at D7.');
    expect(
      describeEvent({ id: 1, kind: 'shot', attacker: 'player', coord: at, result: 'hit' }),
    ).toBe('Your fleet struck an enemy vessel at D7!');
    expect(
      describeEvent({
        id: 1,
        kind: 'shot',
        attacker: 'player',
        coord: at,
        result: 'hit',
        sunk: 'dragonship',
      }),
    ).toBe('Enemy Dragonship sunk at D7!');
  });

  it('describes computer shots without revealing anything new', () => {
    expect(
      describeEvent({ id: 1, kind: 'shot', attacker: 'computer', coord: at, result: 'miss' }),
    ).toBe('Enemy attack missed at D7.');
    expect(
      describeEvent({
        id: 1,
        kind: 'shot',
        attacker: 'computer',
        coord: at,
        result: 'hit',
        sunk: 'raider',
      }),
    ).toBe('Your Raider has been sunk at D7!');
  });

  it('describes the end of the battle', () => {
    expect(describeEvent({ id: 1, kind: 'gameOver', winner: 'player' })).toBe(
      'Victory! The enemy fleet has fallen.',
    );
    expect(eventTone({ id: 1, kind: 'gameOver', winner: 'computer' })).toBe('bad');
  });
});
