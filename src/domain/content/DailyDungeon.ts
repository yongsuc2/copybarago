import { DungeonType, ResourceType } from '../enums';
import { Reward } from '../value-objects/Reward';
import { Result } from '../value-objects/Result';

interface DungeonConfig {
  type: DungeonType;
  dailyLimit: number;
  rewards: { type: ResourceType; amount: number }[];
}

const DUNGEON_CONFIGS: DungeonConfig[] = [
  {
    type: DungeonType.DRAGON_NEST,
    dailyLimit: 3,
    rewards: [
      { type: ResourceType.STAMINA, amount: 20 },
      { type: ResourceType.GEMS, amount: 50 },
    ],
  },
  {
    type: DungeonType.CELESTIAL_TREE,
    dailyLimit: 3,
    rewards: [
      { type: ResourceType.PET_EGG, amount: 1 },
      { type: ResourceType.PET_FOOD, amount: 5 },
    ],
  },
  {
    type: DungeonType.SKY_ISLAND,
    dailyLimit: 3,
    rewards: [
      { type: ResourceType.EQUIPMENT_STONE, amount: 5 },
      { type: ResourceType.GOLD, amount: 200 },
    ],
  },
];

export class DailyDungeon {
  type: DungeonType;
  dailyLimit: number;
  todayCount: number;
  private config: DungeonConfig;

  constructor(type: DungeonType) {
    this.type = type;
    this.todayCount = 0;
    const config = DUNGEON_CONFIGS.find(c => c.type === type);
    if (!config) throw new Error(`Unknown dungeon type: ${type}`);
    this.config = config;
    this.dailyLimit = config.dailyLimit;
  }

  isAvailable(): boolean {
    return this.todayCount < this.dailyLimit;
  }

  getRemainingCount(): number {
    return Math.max(0, this.dailyLimit - this.todayCount);
  }

  enter(): Result<{ reward: Reward }> {
    if (!this.isAvailable()) {
      return Result.fail('Daily limit reached');
    }

    this.todayCount += 1;
    const reward = Reward.fromResources(...this.config.rewards);
    return Result.ok({ reward });
  }

  dailyReset(): void {
    this.todayCount = 0;
  }

  getRewardPreview(): { type: ResourceType; amount: number }[] {
    return this.config.rewards;
  }
}

export class DailyDungeonManager {
  dungeons: Map<DungeonType, DailyDungeon>;

  constructor() {
    this.dungeons = new Map([
      [DungeonType.DRAGON_NEST, new DailyDungeon(DungeonType.DRAGON_NEST)],
      [DungeonType.CELESTIAL_TREE, new DailyDungeon(DungeonType.CELESTIAL_TREE)],
      [DungeonType.SKY_ISLAND, new DailyDungeon(DungeonType.SKY_ISLAND)],
    ]);
  }

  getDungeon(type: DungeonType): DailyDungeon {
    return this.dungeons.get(type)!;
  }

  getAvailableDungeons(): DailyDungeon[] {
    return [...this.dungeons.values()].filter(d => d.isAvailable());
  }

  dailyResetAll(): void {
    for (const dungeon of this.dungeons.values()) {
      dungeon.dailyReset();
    }
  }

  getTotalRemainingCount(): number {
    let total = 0;
    for (const dungeon of this.dungeons.values()) {
      total += dungeon.getRemainingCount();
    }
    return total;
  }
}
