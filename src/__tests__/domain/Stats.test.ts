import { describe, it, expect } from 'vitest';
import { Stats } from '../../domain/value-objects/Stats';

describe('Stats', () => {
  it('creates with default zero values', () => {
    const stats = Stats.ZERO;
    expect(stats.hp).toBe(0);
    expect(stats.maxHp).toBe(0);
    expect(stats.atk).toBe(0);
    expect(stats.def).toBe(0);
    expect(stats.crit).toBe(0);
  });

  it('creates with partial values', () => {
    const stats = Stats.create({ atk: 50, maxHp: 200 });
    expect(stats.atk).toBe(50);
    expect(stats.maxHp).toBe(200);
    expect(stats.hp).toBe(0);
    expect(stats.def).toBe(0);
  });

  it('adds two stats correctly', () => {
    const a = Stats.create({ hp: 10, maxHp: 100, atk: 20, def: 5, crit: 0.1 });
    const b = Stats.create({ hp: 5, maxHp: 50, atk: 10, def: 3, crit: 0.05 });
    const result = a.add(b);

    expect(result.hp).toBe(15);
    expect(result.maxHp).toBe(150);
    expect(result.atk).toBe(30);
    expect(result.def).toBe(8);
    expect(result.crit).toBeCloseTo(0.15);
  });

  it('multiplies stats by factor', () => {
    const stats = Stats.create({ hp: 100, maxHp: 100, atk: 20, def: 10, crit: 0.1 });
    const result = stats.multiply(2);

    expect(result.hp).toBe(200);
    expect(result.maxHp).toBe(200);
    expect(result.atk).toBe(40);
    expect(result.def).toBe(20);
    expect(result.crit).toBeCloseTo(0.2);
  });

  it('floors values when multiplying', () => {
    const stats = Stats.create({ hp: 10, maxHp: 10, atk: 7 });
    const result = stats.multiply(1.5);

    expect(result.hp).toBe(15);
    expect(result.atk).toBe(10);
  });

  it('clones without sharing reference', () => {
    const original = Stats.create({ atk: 50 });
    const cloned = original.clone();
    expect(cloned.atk).toBe(50);
    expect(cloned).not.toBe(original);
  });

  it('creates stats with modified hp via withHp', () => {
    const stats = Stats.create({ hp: 50, maxHp: 100, atk: 20 });
    const result = stats.withHp(80);
    expect(result.hp).toBe(80);
    expect(result.maxHp).toBe(100);
    expect(result.atk).toBe(20);
  });
});
