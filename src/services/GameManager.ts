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
import { ChapterTreasure } from '../domain/economy/ChapterTreasure';
import { ChapterTreasureTable } from '../domain/data/ChapterTreasureTable';
import { Result } from '../domain/value-objects/Result';
import { EventBus } from '../infrastructure/EventBus';
import { SeededRandom } from '../infrastructure/SeededRandom';
import { ChapterType, ChestType, DungeonType, ResourceType } from '../domain/enums';
import { SaveManager } from '../domain/meta/SaveManager';
import { SaveSerializer } from './SaveSerializer';

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

  chapterTreasure: ChapterTreasure;
  battleManager: BattleManager;
  forge: Forge;
  equipmentManager: EquipmentManager;
  petManager: PetManager;
  resourceAllocator: ResourceAllocator;

  eventBus: EventBus;
  rng: SeededRandom;
  saveManager: SaveManager;

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

    this.chapterTreasure = new ChapterTreasure();
    this.battleManager = new BattleManager();
    this.forge = new Forge();
    this.equipmentManager = new EquipmentManager();
    this.petManager = new PetManager();
    this.resourceAllocator = new ResourceAllocator();

    this.eventBus = new EventBus();
    this.rng = new SeededRandom(Date.now());
    this.saveManager = new SaveManager();

    if (this.saveManager.hasSave()) {
      this.loadGame();
    } else {
      this.initNewGame();
    }
  }

  private initNewGame(): void {
    this.player.resources.setAmount(ResourceType.GOLD, 2000);
    this.player.resources.setAmount(ResourceType.GEMS, 500);
    this.player.resources.setAmount(ResourceType.STAMINA, 100);
    this.player.resources.dailyReset();
    this.eventManager.createDailyQuests();
    this.eventManager.createWeeklyQuests();
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

  updateQuestProgress(missionId: string, amount: number = 1): void {
    for (const event of this.eventManager.getActiveEvents()) {
      event.updateMissionProgress(missionId, amount);
    }
  }

  claimChapterTreasure(milestoneId: string) {
    const milestone = ChapterTreasureTable.getMilestoneById(milestoneId);
    if (!milestone) return Result.fail('마일스톤을 찾을 수 없습니다');
    return this.chapterTreasure.claim(milestone, this.player);
  }

  checkDailyReset(): void {
    if (this.dailyReset.needsReset()) {
      this.dailyReset.performReset(this.player.resources, this.dungeonManager, this.arena);
      this.eventManager.cleanupExpired();
      this.eventManager.createDailyQuests();
      if (!this.eventManager.hasActiveWeeklyQuest()) {
        this.eventManager.createWeeklyQuests();
      }
    }
  }

  saveGame(): boolean {
    const state = SaveSerializer.serialize(this);
    const result = this.saveManager.save(state as unknown as Record<string, unknown>);
    return result.isOk();
  }

  loadGame(): boolean {
    const result = this.saveManager.load();
    if (result.isFail() || !result.data) return false;
    try {
      SaveSerializer.deserialize(result.data.playerData as unknown as ReturnType<typeof SaveSerializer.serialize>, this);
      return true;
    } catch {
      return false;
    }
  }

  deleteSave(): boolean {
    return this.saveManager.deleteSave().isOk();
  }

  hasSave(): boolean {
    return this.saveManager.hasSave();
  }

  exportSave(): string {
    const state = SaveSerializer.serialize(this);
    const json = JSON.stringify(state);
    return btoa(encodeURIComponent(json));
  }

  importSave(encoded: string): boolean {
    try {
      const json = decodeURIComponent(atob(encoded));
      const state = JSON.parse(json);
      SaveSerializer.deserialize(state, this);
      return true;
    } catch {
      return false;
    }
  }

  getLastSaveTime(): number | null {
    return this.saveManager.getLastSaveTime();
  }
}
