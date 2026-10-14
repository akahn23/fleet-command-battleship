import { describeEvent, eventTone } from './messages';

const at = { row: 6, col: 3 }; // D7

describe('battle log messages', () => {
  it('describes player shots', () => {
    expect(
      describeEvent({ id: 1, kind: 'shot', attacker: 'player', coord: at, result: 'miss' }),
    ).toBe('Your volley splashed into open waters at D7.');
    expect(
      describeEvent({ id: 1, kind: 'shot', attacker: 'player', coord: at, result: 'hit' }),
    ).toBe('Your volley struck true at D7!');
    expect(
      describeEvent({
        id: 1,
        kind: 'shot',
        attacker: 'player',
        coord: at,
        result: 'hit',
        sunk: 'dragonship',
      }),
    ).toBe("The enemy Dragonship sinks to Rán's halls at D7!");
    expect(
      describeEvent({
        id: 1,
        kind: 'shot',
        attacker: 'player',
        coord: at,
        result: 'hit',
      }),
    ).not.toMatch(/Great Longship|Dragonship|War Longship|Raider|Scout Ship/);
  });

  it('describes computer shots without revealing anything new', () => {
    expect(
      describeEvent({ id: 1, kind: 'shot', attacker: 'computer', coord: at, result: 'miss' }),
    ).toBe("The enemy's volley broke upon the sea at D7.");
    expect(
      describeEvent({ id: 1, kind: 'shot', attacker: 'computer', coord: at, result: 'hit' }),
    ).toBe("The enemy's spear found purchase at D7!");
    expect(
      describeEvent({
        id: 1,
        kind: 'shot',
        attacker: 'computer',
        coord: at,
        result: 'hit',
        sunk: 'raider',
      }),
    ).toBe("Your Raider sinks to Rán's halls at D7!");
  });

  it('describes the end of the battle', () => {
    expect(describeEvent({ id: 1, kind: 'gameOver', winner: 'player' })).toBe(
      'Your name rises in Valhalla!',
    );
    expect(eventTone({ id: 1, kind: 'gameOver', winner: 'computer' })).toBe('bad');
  });
});
