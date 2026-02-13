import { describe, it, expect } from 'vitest';
import { Arena } from '../../domain/content/Arena';
import { ArenaTier } from '../../domain/enums';
import { BattleUnit } from '../../domain/battle/BattleUnit';
import { Stats } from '../../domain/value-objects/Stats';
import { SeededRandom } from '../../infrastructure/SeededRandom';

describe('Arena', () => {
  it('starts at bronze tier', () => {
    const arena = new Arena();
    expect(arena.tier).toBe(ArenaTier.BRONZE);
  });

  it('matches 4 opponents', () => {
    const arena = new Arena();
    const rng = new SeededRandom(42);
    const opponents = arena.matchOpponents(rng);

    expect(opponents.length).toBe(4);
    opponents.forEach(o => {
      expect(o.maxHp).toBeGreaterThan(0);
      expect(o.baseAtk).toBeGreaterThan(0);
    });
  });

  it('consumes entry on fight', () => {
    const arena = new Arena();
    const player = new BattleUnit('Player', Stats.create({ hp: 500, maxHp: 500, atk: 100, def: 20 }), [], true);
    const rng = new SeededRandom(42);

    arena.fight(player, 1, rng);
    expect(arena.todayEntries).toBe(1);
  });

  it('respects daily entry limit', () => {
    const arena = new Arena();
    const player = new BattleUnit('Player', Stats.create({ hp: 500, maxHp: 500, atk: 100, def: 20 }), [], true);
    const rng = new SeededRandom(42);

    for (let i = 0; i < 5; i++) {
      arena.fight(player, 1, rng);
    }

    expect(arena.isAvailable()).toBe(false);
    const result = arena.fight(player, 1, rng);
    expect(result.isFail()).toBe(true);
  });

  it('resets entries on daily reset', () => {
    const arena = new Arena();
    const player = new BattleUnit('Player', Stats.create({ hp: 500, maxHp: 500, atk: 100, def: 20 }), [], true);
    const rng = new SeededRandom(42);

    arena.fight(player, 1, rng);
    arena.dailyReset();
    expect(arena.getRemainingEntries()).toBe(5);
  });

  it('returns battle results', () => {
    const arena = new Arena();
    const player = new BattleUnit('Player', Stats.create({ hp: 500, maxHp: 500, atk: 100, def: 20 }), [], true);
    const rng = new SeededRandom(42);

    const result = arena.fight(player, 1, rng);
    expect(result.isOk()).toBe(true);
    expect(result.data?.results.length).toBe(4);
  });
});
