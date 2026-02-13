import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../../infrastructure/SeededRandom';

describe('SeededRandom', () => {
  it('produces deterministic results with same seed', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);

    const resultsA = Array.from({ length: 10 }, () => a.next());
    const resultsB = Array.from({ length: 10 }, () => b.next());

    expect(resultsA).toEqual(resultsB);
  });

  it('produces different results with different seeds', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(99);

    expect(a.next()).not.toBe(b.next());
  });

  it('generates integers within range', () => {
    const rng = new SeededRandom(12345);
    for (let i = 0; i < 100; i++) {
      const val = rng.nextInt(1, 10);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(10);
    }
  });

  it('generates floats within range', () => {
    const rng = new SeededRandom(12345);
    for (let i = 0; i < 100; i++) {
      const val = rng.nextFloat(0.5, 1.5);
      expect(val).toBeGreaterThanOrEqual(0.5);
      expect(val).toBeLessThan(1.5);
    }
  });

  it('picks from array', () => {
    const rng = new SeededRandom(42);
    const items = ['a', 'b', 'c'];
    const picked = rng.pick(items);
    expect(items).toContain(picked);
  });

  it('weighted pick respects weights', () => {
    const rng = new SeededRandom(42);
    const entries = [
      { item: 'common', weight: 90 },
      { item: 'rare', weight: 10 },
    ];

    let commonCount = 0;
    for (let i = 0; i < 1000; i++) {
      if (rng.weightedPick(entries) === 'common') commonCount++;
    }

    expect(commonCount).toBeGreaterThan(800);
    expect(commonCount).toBeLessThan(950);
  });

  it('chance returns boolean based on probability', () => {
    const rng = new SeededRandom(42);
    let trueCount = 0;
    for (let i = 0; i < 1000; i++) {
      if (rng.chance(0.5)) trueCount++;
    }
    expect(trueCount).toBeGreaterThan(400);
    expect(trueCount).toBeLessThan(600);
  });

  it('shuffle preserves all elements', () => {
    const rng = new SeededRandom(42);
    const original = [1, 2, 3, 4, 5];
    const shuffled = rng.shuffle(original);

    expect(shuffled.sort()).toEqual(original.sort());
    expect(shuffled).not.toBe(original);
  });
});
