import { describe, it, expect } from 'vitest';
import { DailyDungeon, DailyDungeonManager } from '../../domain/content/DailyDungeon';
import { DungeonType, ResourceType } from '../../domain/enums';
import { BattleUnit } from '../../domain/battle/BattleUnit';
import { Stats } from '../../domain/value-objects/Stats';

function makePlayerUnit(): BattleUnit {
  const stats = Stats.create({ hp: 0, maxHp: 500, atk: 50, def: 20, crit: 5 });
  return new BattleUnit('Capybara', stats, [], [], true);
}

describe('DailyDungeon', () => {
  it('creates a battle with stage scaling', () => {
    const dungeon = new DailyDungeon(DungeonType.DRAGON_NEST);
    const result = dungeon.createBattle(makePlayerUnit());
    expect(result.isOk()).toBe(true);
    expect(result.data!.battle).toBeDefined();
    expect(result.data!.battle.enemy).toBeDefined();
  });

  it('increments clearedStage on victory', () => {
    const dungeon = new DailyDungeon(DungeonType.DRAGON_NEST);
    expect(dungeon.clearedStage).toBe(0);

    const reward = dungeon.onBattleVictory();
    expect(dungeon.clearedStage).toBe(1);
    expect(reward.resources.length).toBeGreaterThan(0);
  });

  it('scales rewards per stage', () => {
    const dungeon = new DailyDungeon(DungeonType.DRAGON_NEST);
    const stage1 = dungeon.getRewardForStage(1);
    const stage5 = dungeon.getRewardForStage(5);

    for (let i = 0; i < stage1.length; i++) {
      expect(stage5[i].amount).toBeGreaterThan(stage1[i].amount);
    }
  });

  it('returns accumulated sweep reward', () => {
    const dungeon = new DailyDungeon(DungeonType.CELESTIAL_TREE);
    expect(dungeon.getSweepReward().resources.length).toBe(0);

    dungeon.onBattleVictory();
    dungeon.onBattleVictory();
    dungeon.onBattleVictory();

    const sweep = dungeon.getSweepReward();
    expect(sweep.resources.length).toBeGreaterThan(0);

    const stage1 = dungeon.getRewardForStage(1);
    const stage2 = dungeon.getRewardForStage(2);
    const stage3 = dungeon.getRewardForStage(3);

    for (const r of sweep.resources) {
      const s1 = stage1.find(s => s.type === r.type)?.amount ?? 0;
      const s2 = stage2.find(s => s.type === r.type)?.amount ?? 0;
      const s3 = stage3.find(s => s.type === r.type)?.amount ?? 0;
      expect(r.amount).toBe(s1 + s2 + s3);
    }
  });

  it('returns reward preview for next stage', () => {
    const dungeon = new DailyDungeon(DungeonType.SKY_ISLAND);
    const preview = dungeon.getRewardPreview();
    expect(preview.length).toBeGreaterThan(0);
    expect(preview).toEqual(dungeon.getRewardForStage(1));
  });
});

describe('DailyDungeonManager', () => {
  it('manages all three dungeons', () => {
    const manager = new DailyDungeonManager();
    expect(manager.getAvailableDungeons().length).toBe(3);
  });

  it('uses shared daily limit across all dungeons', () => {
    const manager = new DailyDungeonManager();
    expect(manager.isAvailable()).toBe(true);
    expect(manager.getRemainingCount()).toBe(manager.dailyLimit);

    manager.consumeEntry();
    manager.consumeEntry();
    manager.consumeEntry();

    expect(manager.isAvailable()).toBe(false);
    expect(manager.getRemainingCount()).toBe(0);
  });

  it('resets todayCount on daily reset', () => {
    const manager = new DailyDungeonManager();
    manager.consumeEntry();
    manager.consumeEntry();
    manager.consumeEntry();

    manager.dailyResetAll();
    expect(manager.isAvailable()).toBe(true);
    expect(manager.getRemainingCount()).toBe(manager.dailyLimit);
  });

  it('preserves clearedStage across daily reset', () => {
    const manager = new DailyDungeonManager();
    const dungeon = manager.getDungeon(DungeonType.DRAGON_NEST);
    dungeon.onBattleVictory();
    dungeon.onBattleVictory();

    manager.dailyResetAll();
    expect(dungeon.clearedStage).toBe(2);
  });

  it('reports total remaining count', () => {
    const manager = new DailyDungeonManager();
    expect(manager.getTotalRemainingCount()).toBe(manager.dailyLimit);

    manager.consumeEntry();
    expect(manager.getTotalRemainingCount()).toBe(manager.dailyLimit - 1);
  });
});
