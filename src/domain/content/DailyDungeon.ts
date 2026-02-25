import { DungeonType, ResourceType } from '../enums';
import { Reward } from '../value-objects/Reward';
import { Result } from '../value-objects/Result';
import { Battle } from '../battle/Battle';
import { BattleUnit } from '../battle/BattleUnit';
import { EnemyTemplate } from '../chapter/EnemyTemplate';
import { DungeonDataTable } from '../data/DungeonDataTable';

type DungeonConfig = typeof DungeonDataTable.dungeons[keyof typeof DungeonDataTable.dungeons];

export class DailyDungeon {
  type: DungeonType;
  clearedStage: number;
  private config: DungeonConfig;

  constructor(type: DungeonType) {
    this.type = type;
    this.clearedStage = 0;
    this.config = DungeonDataTable.dungeons[type];
  }

  getNextStage(): number {
    return this.clearedStage + 1;
  }

  createBattle(playerUnit: BattleUnit): Result<{ battle: Battle }> {
    const template = EnemyTemplate.fromId(this.config.enemyId);
    if (!template) return Result.fail('Enemy not found');

    const stage = this.getNextStage();
    const { statMultiplierBase, statMultiplierPerStage } = DungeonDataTable.stageScaling;
    const multiplier = statMultiplierBase + statMultiplierPerStage * (stage - 1);

    const enemyUnit = template.createInstance(1, multiplier);
    const battle = new Battle(playerUnit, enemyUnit, Date.now());

    return Result.ok({ battle });
  }

  onBattleVictory(): Reward {
    this.clearedStage += 1;
    return this.getRewardForCurrentStage();
  }

  getRewardForStage(stage: number): { type: ResourceType; amount: number }[] {
    const scaling = 1 + this.config.rewardScaling * (stage - 1);
    return this.config.baseRewards.map(r => ({
      type: r.type as ResourceType,
      amount: Math.floor(r.amount * scaling),
    }));
  }

  private getRewardForCurrentStage(): Reward {
    const resources = this.getRewardForStage(this.clearedStage);
    return Reward.fromResources(...resources);
  }

  getSweepReward(): Reward {
    if (this.clearedStage <= 0) return Reward.empty();

    const totals = new Map<ResourceType, number>();
    for (let s = 1; s <= this.clearedStage; s++) {
      for (const r of this.getRewardForStage(s)) {
        totals.set(r.type, (totals.get(r.type) ?? 0) + r.amount);
      }
    }

    return Reward.fromResources(
      ...[...totals.entries()].map(([type, amount]) => ({ type, amount })),
    );
  }

  getRewardPreview(): { type: ResourceType; amount: number }[] {
    return this.getRewardForStage(this.getNextStage());
  }
}

export class DailyDungeonManager {
  dungeons: Map<DungeonType, DailyDungeon>;
  todayCount: number;
  readonly dailyLimit: number;

  constructor() {
    this.todayCount = 0;
    this.dailyLimit = DungeonDataTable.dailyLimit;
    this.dungeons = new Map([
      [DungeonType.DRAGON_NEST, new DailyDungeon(DungeonType.DRAGON_NEST)],
      [DungeonType.CELESTIAL_TREE, new DailyDungeon(DungeonType.CELESTIAL_TREE)],
      [DungeonType.SKY_ISLAND, new DailyDungeon(DungeonType.SKY_ISLAND)],
    ]);
  }

  getDungeon(type: DungeonType): DailyDungeon {
    return this.dungeons.get(type)!;
  }

  isAvailable(): boolean {
    return this.todayCount < this.dailyLimit;
  }

  getRemainingCount(): number {
    return Math.max(0, this.dailyLimit - this.todayCount);
  }

  consumeEntry(): void {
    this.todayCount += 1;
  }

  getAvailableDungeons(): DailyDungeon[] {
    return [...this.dungeons.values()];
  }

  dailyResetAll(): void {
    this.todayCount = 0;
  }

  getTotalRemainingCount(): number {
    return this.getRemainingCount();
  }
}
