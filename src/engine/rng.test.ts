import { Rng } from './rng';

describe('Rng', () => {
  it('is deterministic for a given seed', () => {
    const a = new Rng(123);
    const b = new Rng(123);
    const seqA = Array.from({ length: 20 }, () => a.next());
    const seqB = Array.from({ length: 20 }, () => b.next());
    expect(seqA).toEqual(seqB);
    expect(new Rng(124).next()).not.toBe(seqA[0]);
  });

  it('produces values in range', () => {
    const rng = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const f = rng.next();
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(1);
      const n = rng.int(10);
      expect(Number.isInteger(n) && n >= 0 && n < 10).toBe(true);
    }
  });

  it('refuses to pick from an empty list', () => {
    expect(() => new Rng(1).pick([])).toThrow();
  });
});
