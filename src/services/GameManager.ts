import { Player } from '../domain/entities/Player';
import { Chapter } from '../domain/chapter/Chapter';
import { Tower } from '../domain/content/Tower';
import { CatacombDungeon } from '../domain/content/CatacombDungeon';
import { DailyDungeonManager } from '../domain/content/DailyDungeon';
import { Arena } from '../domain/content/Arena';
import { Travel } from '../domain/content/Travel';
import { GoblinMiner } from '../domain/content/GoblinMiner';
import { TreasureChest } from '../domain/economy/TreasureChest';
import { Collection } from '../domain/economy/Collection';
import { DailyResetSystem } from '../domain/economy/DailyResetSystem';
import { EventManager } from '../domain/meta/GameEvent';
import { DailyRoutineScheduler } from '../domain/meta/DailyRoutineScheduler';
import { OfflineRewardCalculator } from '../domain/meta/OfflineRewardCalculator';
import { BattleManager } from './BattleManager';
import { Forge } from './Forge';
import { EquipmentManager } from './EquipmentManager';
import { PetManager } from './PetManager';
import { ResourceAllocator } from './ResourceAllocator';
import { EventBus } from '../infrastructure/EventBus';
import { SeededRandom } from '../infrastructure/SeededRandom';
import { ChapterType, ChestType, DungeonType, ResourceType } from '../domain/enums';

export class GameManager {
  player: Player;
  currentChapter: Chapter | null;

  tower: Tower;
  catacomb: CatacombDungeon;
  dungeonManager: DailyDungeonManager;
  arena: Arena;
  travel: Travel;
  goblinMiner: GoblinMiner;

  goldChest: TreasureChest;
  collection: Collection;
  dailyReset: DailyResetSystem;
  eventManager: EventManager;
  routineScheduler: DailyRoutineScheduler;
  offlineCalc: OfflineRewardCalculator;

  battleManager: BattleManager;
  forge: Forge;
  equipmentManager: EquipmentManager;
  petManager: PetManager;
  resourceAllocator: ResourceAllocator;

  eventBus: EventBus;
  rng: SeededRandom;

  constructor() {
    this.player = new Player();
    this.currentChapter = null;

    this.tower = new Tower();
    this.catacomb = new CatacombDungeon();
    this.dungeonManager = new DailyDungeonManager();
    this.arena = new Arena();
    this.travel = new Travel();
    this.goblinMiner = new GoblinMiner();

    this.goldChest = new TreasureChest(ChestType.GOLD);
    this.collection = new Collection();
    this.dailyReset = new DailyResetSystem();
    this.eventManager = new EventManager();
    this.routineScheduler = new DailyRoutineScheduler();
    this.offlineCalc = new OfflineRewardCalculator();

    this.battleManager = new BattleManager();
    this.forge = new Forge();
    this.equipmentManager = new EquipmentManager();
    this.petManager = new PetManager();
    this.resourceAllocator = new ResourceAllocator();

    this.eventBus = new EventBus();
    this.rng = new SeededRandom(Date.now());

    this.initNewGame();
  }

  private initNewGame(): void {
    this.player.resources.setAmount(ResourceType.GOLD, 1000);
    this.player.resources.setAmount(ResourceType.GEMS, 500);
    this.player.resources.setAmount(ResourceType.STAMINA, 100);
    this.player.resources.dailyReset();
    this.eventManager.createDailyQuests();
  }

  startChapter(chapterId: number, type: ChapterType): void {
    const staminaCost = 5;
    if (!this.player.resources.canAfford(ResourceType.STAMINA, staminaCost)) return;
    this.player.resources.spend(ResourceType.STAMINA, staminaCost);
    this.currentChapter = new Chapter(chapterId, type, this.rng.nextInt(0, 999999));
  }

  enterDungeon(type: DungeonType) {
    const dungeon = this.dungeonManager.getDungeon(type);
    const result = dungeon.enter();
    if (result.isOk() && result.data) {
      for (const r of result.data.reward.resources) {
        this.player.resources.add(r.type, r.amount);
      }
    }
    return result;
  }

  pullGacha() {
    const cost = this.goldChest.getCostPerPull();
    if (!this.player.resources.canAfford(ResourceType.GEMS, cost)) {
      return null;
    }
    this.player.resources.spend(ResourceType.GEMS, cost);
    return this.goldChest.pull(this.rng);
  }

  pullGacha10() {
    const cost = this.goldChest.getPull10Cost();
    if (!this.player.resources.canAfford(ResourceType.GEMS, cost)) {
      return null;
    }
    this.player.resources.spend(ResourceType.GEMS, cost);
    return this.goldChest.pull10(this.rng);
  }

  travelRun(stamina: number) {
    const result = this.travel.run(stamina, this.player.resources.stamina);
    if (result.isOk() && result.data) {
      this.player.resources.spend(ResourceType.STAMINA, result.data.staminaSpent);
      for (const r of result.data.reward.resources) {
        this.player.resources.add(r.type, r.amount);
      }
    }
    return result;
  }

  checkDailyReset(): void {
    if (this.dailyReset.needsReset()) {
      this.dailyReset.performReset(this.player.resources, this.dungeonManager, this.arena);
      this.eventManager.cleanupExpired();
      this.eventManager.createDailyQuests();
    }
  }
}
