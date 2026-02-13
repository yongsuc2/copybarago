import { describe, it, expect } from 'vitest';
import { DailyDungeon, DailyDungeonManager } from '../../domain/content/DailyDungeon';
import { DungeonType } from '../../domain/enums';

describe('DailyDungeon', () => {
  it('allows entries up to daily limit', () => {
    const dungeon = new DailyDungeon(DungeonType.DRAGON_NEST);
    expect(dungeon.isAvailable()).toBe(true);

    for (let i = 0; i < 3; i++) {
      const result = dungeon.enter();
      expect(result.isOk()).toBe(true);
    }

    expect(dungeon.isAvailable()).toBe(false);
    const result = dungeon.enter();
    expect(result.isFail()).toBe(true);
  });

  it('resets count on daily reset', () => {
    const dungeon = new DailyDungeon(DungeonType.DRAGON_NEST);
    dungeon.enter();
    dungeon.enter();
    dungeon.enter();

    dungeon.dailyReset();
    expect(dungeon.isAvailable()).toBe(true);
    expect(dungeon.getRemainingCount()).toBe(3);
  });

  it('returns rewards on entry', () => {
    const dungeon = new DailyDungeon(DungeonType.CELESTIAL_TREE);
    const result = dungeon.enter();

    expect(result.isOk()).toBe(true);
    expect(result.data?.reward.resources.length).toBeGreaterThan(0);
  });
});

describe('DailyDungeonManager', () => {
  it('manages all three dungeons', () => {
    const manager = new DailyDungeonManager();
    expect(manager.getAvailableDungeons().length).toBe(3);
  });

  it('resets all dungeons', () => {
    const manager = new DailyDungeonManager();
    manager.getDungeon(DungeonType.DRAGON_NEST).enter();
    manager.getDungeon(DungeonType.DRAGON_NEST).enter();
    manager.getDungeon(DungeonType.DRAGON_NEST).enter();

    expect(manager.getDungeon(DungeonType.DRAGON_NEST).isAvailable()).toBe(false);

    manager.dailyResetAll();
    expect(manager.getDungeon(DungeonType.DRAGON_NEST).isAvailable()).toBe(true);
  });

  it('reports total remaining count', () => {
    const manager = new DailyDungeonManager();
    expect(manager.getTotalRemainingCount()).toBe(9);

    manager.getDungeon(DungeonType.DRAGON_NEST).enter();
    expect(manager.getTotalRemainingCount()).toBe(8);
  });
});
