import { ChapterType, EncounterType, BattleState } from '../enums';
import { Encounter, type EncounterResult } from './Encounter';
import { EncounterGenerator } from './EncounterGenerator';
import { EnemyTemplate } from './EnemyTemplate';
import { BattleUnit } from '../battle/BattleUnit';
import { Battle } from '../battle/Battle';
import { Skill } from '../entities/Skill';
import { Reward } from '../value-objects/Reward';
import { EnemyTable } from '../data/EnemyTable';
import { SeededRandom } from '../../infrastructure/SeededRandom';

export enum ChapterState {
  IN_PROGRESS = 'IN_PROGRESS',
  CLEARED = 'CLEARED',
  FAILED = 'FAILED',
}

export interface ChapterSessionState {
  chapterId: number;
  chapterType: ChapterType;
  currentDay: number;
  totalDays: number;
  state: ChapterState;
  sessionSkills: Skill[];
  currentEncounter: Encounter | null;
  currentBattle: Battle | null;
  totalReward: Reward;
  playerCurrentHp: number;
  playerMaxHp: number;
}

export class Chapter {
  id: number;
  type: ChapterType;
  totalDays: number;
  currentDay: number;
  state: ChapterState;
  sessionSkills: Skill[];
  currentEncounter: Encounter | null;
  currentBattle: Battle | null;
  totalReward: Reward;
  sessionGold: number;

  private encounterGenerator: EncounterGenerator;
  private rng: SeededRandom;

  constructor(id: number, type: ChapterType, seed: number = Date.now()) {
    this.id = id;
    this.type = type;
    this.totalDays = this.getDaysForType(type);
    this.currentDay = 0;
    this.state = ChapterState.IN_PROGRESS;
    this.sessionSkills = [];
    this.currentEncounter = null;
    this.currentBattle = null;
    this.totalReward = Reward.empty();
    this.sessionGold = 0;
    this.encounterGenerator = new EncounterGenerator(seed);
    this.rng = new SeededRandom(seed + 1);
  }

  private getDaysForType(type: ChapterType): number {
    switch (type) {
      case ChapterType.SIXTY_DAY: return 60;
      case ChapterType.THIRTY_DAY: return 30;
      case ChapterType.FIVE_DAY: return 5;
    }
  }

  advanceDay(): Encounter | null {
    if (this.state !== ChapterState.IN_PROGRESS) return null;

    this.currentDay += 1;

    if (this.currentDay >= this.totalDays) {
      this.currentEncounter = null;
      return null;
    }

    const existingIds = this.sessionSkills.map(s => s.id);
    this.currentEncounter = this.encounterGenerator.generate(
      this.type, this.currentDay, existingIds
    );

    return this.currentEncounter;
  }

  resolveEncounter(
    choiceIndex: number,
    playerCurrentHp: number,
    playerMaxHp: number,
  ): EncounterResult | null {
    if (!this.currentEncounter) return null;

    if (this.currentEncounter.type === EncounterType.COMBAT && choiceIndex === 0) {
      return null;
    }

    const roll = this.rng.next();
    const result = this.currentEncounter.resolve(
      choiceIndex, playerCurrentHp, playerMaxHp, this.sessionGold, roll
    );

    for (const skill of result.skillsGained) {
      this.sessionSkills.push(skill);
    }

    this.sessionGold += result.goldChange;
    this.totalReward = this.totalReward.merge(result.reward);
    this.currentEncounter = null;

    return result;
  }

  createCombatBattle(playerUnit: BattleUnit): Battle | null {
    if (!this.currentEncounter || this.currentEncounter.type !== EncounterType.COMBAT) {
      return null;
    }

    const enemyId = EnemyTable.getRandomEnemyId();
    const template = EnemyTemplate.fromId(enemyId);
    if (!template) return null;

    const enemy = template.createInstance(this.id);
    this.currentBattle = new Battle(playerUnit, enemy, this.rng.nextInt(0, 999999));
    return this.currentBattle;
  }

  createBossBattle(playerUnit: BattleUnit): Battle | null {
    const bossId = EnemyTable.getRandomBossId();
    const template = EnemyTemplate.fromId(bossId);
    if (!template) return null;

    const boss = template.createInstance(this.id);
    this.currentBattle = new Battle(playerUnit, boss, this.rng.nextInt(0, 999999));
    return this.currentBattle;
  }

  onBattleEnd(result: BattleState): void {
    this.currentBattle = null;

    if (result === BattleState.DEFEAT) {
      this.state = ChapterState.FAILED;
      return;
    }

    if (this.currentEncounter) {
      this.currentEncounter = null;
    }
  }

  onBossDefeated(): void {
    this.state = ChapterState.CLEARED;
  }

  isBossDay(): boolean {
    return this.currentDay >= this.totalDays;
  }

  isCompleted(): boolean {
    return this.state === ChapterState.CLEARED;
  }

  isFailed(): boolean {
    return this.state === ChapterState.FAILED;
  }

  getProgress(): number {
    return this.totalDays > 0 ? this.currentDay / this.totalDays : 0;
  }

  getSessionSkillIds(): string[] {
    return this.sessionSkills.map(s => s.id);
  }
}
