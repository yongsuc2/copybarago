import { ChapterType, EncounterType, BattleState, ResourceType, PassiveType, StatType } from '../enums';
import { Encounter, type EncounterResult } from './Encounter';
import { EncounterGenerator } from './EncounterGenerator';
import { EnemyTemplate } from './EnemyTemplate';
import { BattleUnit, type SessionSkill, isActiveSkill } from '../battle/BattleUnit';
import { Battle } from '../battle/Battle';
import { ActiveSkillRegistry } from '../data/ActiveSkillRegistry';
import type { ActiveSkill } from '../entities/ActiveSkill';
import { Reward } from '../value-objects/Reward';
import { EnemyTable } from '../data/EnemyTable';
import { EncounterDataTable } from '../data/EncounterDataTable';
import { BattleDataTable } from '../data/BattleDataTable';
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
  sessionSkills: SessionSkill[];
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
  sessionSkills: SessionSkill[];
  currentEncounter: Encounter | null;
  currentBattle: Battle | null;
  totalReward: Reward;
  sessionGold: number;
  sessionCurrentHp: number;
  sessionMaxHp: number;
  baseSessionMaxHp: number;
  jungbakCount: number;
  daebakCount: number;
  optionalEliteTriggered: boolean;
  sessionRerollsRemaining: number;

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
    this.sessionCurrentHp = 0;
    this.sessionMaxHp = 0;
    this.baseSessionMaxHp = 0;
    this.jungbakCount = 0;
    this.daebakCount = 0;
    this.optionalEliteTriggered = false;
    this.sessionRerollsRemaining = EncounterDataTable.rerollsPerSession;
    this.encounterGenerator = new EncounterGenerator(seed);
    this.rng = new SeededRandom(seed + 1);
  }

  initSessionHp(maxHp: number): void {
    this.baseSessionMaxHp = maxHp;
    this.sessionCurrentHp = maxHp;
    this.sessionMaxHp = maxHp;
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

    this.optionalEliteTriggered = false;
    this.currentDay += 1;

    if (this.currentDay >= this.totalDays) {
      this.currentEncounter = null;
      return null;
    }

    if (this.isEliteDay() || this.isMidBossDay() || this.rollOptionalElite()) {
      this.currentEncounter = null;
      return null;
    }

    const threshold = EncounterDataTable.counterThreshold;

    if (this.daebakCount >= threshold.daebak) {
      this.daebakCount = 0;
      this.currentEncounter = this.encounterGenerator.generateDaebakRoulette(this.sessionSkills);
      return this.currentEncounter;
    }

    if (this.jungbakCount >= threshold.jungbak) {
      this.jungbakCount = 0;
      this.currentEncounter = this.encounterGenerator.generateJungbakRoulette(this.sessionSkills);
      return this.currentEncounter;
    }

    this.currentEncounter = this.encounterGenerator.generate(
      this.type, this.currentDay, this.sessionSkills, this.id
    );

    return this.currentEncounter;
  }

  rerollEncounter(): Encounter | null {
    if (!this.currentEncounter || this.sessionRerollsRemaining <= 0) return null;
    this.sessionRerollsRemaining--;
    this.currentEncounter = this.encounterGenerator.regenerate(
      this.currentEncounter.type, this.sessionSkills, this.id
    );
    return this.currentEncounter;
  }

  resolveEncounter(
    choiceIndex: number,
    playerCurrentHp: number,
    playerMaxHp: number,
  ): EncounterResult | null {
    if (!this.currentEncounter) return null;

    const encType = this.currentEncounter.type;

    if (encType === EncounterType.COMBAT && choiceIndex === 0) {
      return null;
    }

    const roll = this.rng.next();
    const result = this.currentEncounter.resolve(
      choiceIndex, playerCurrentHp, playerMaxHp, this.sessionGold, roll
    );

    const idsToRemove = result.chosen.reward.skillIdsToRemove;
    for (const id of idsToRemove) {
      const idx = this.sessionSkills.findIndex(s => s.id === id);
      if (idx >= 0) {
        result.skillsRemoved.push(this.sessionSkills[idx]);
        this.sessionSkills.splice(idx, 1);
      }
    }

    for (const skill of result.skillsGained) {
      const existingIdx = this.sessionSkills.findIndex(s => s.id === skill.id);
      if (existingIdx >= 0) {
        this.sessionSkills[existingIdx] = skill;
      } else {
        this.sessionSkills.push(skill);
      }
    }

    if (result.skillsGained.length > 0 || result.skillsRemoved.length > 0) {
      this.recalcSessionMaxHp();
    }

    this.sessionGold += result.goldChange;
    for (const r of result.reward.resources) {
      if (r.type === ResourceType.GOLD) this.sessionGold += r.amount;
    }
    this.totalReward = this.totalReward.merge(result.reward);

    this.currentEncounter = null;

    this.sessionCurrentHp = Math.max(0, Math.min(
      this.sessionCurrentHp + result.hpChange,
      this.sessionMaxHp,
    ));

    return result;
  }

  updateSessionHpAfterBattle(remainingHp: number): void {
    this.sessionCurrentHp = Math.max(0, Math.min(remainingHp, this.sessionMaxHp));
  }

  getSessionActiveSkills(): ActiveSkill[] {
    const builtins = ActiveSkillRegistry.getBuiltinSkills();
    const lowerLowest = ActiveSkillRegistry.getAll().filter(
      s => (s.hierarchy === 'LOWER' || s.hierarchy === 'LOWEST') && s.tier === 1
    );

    const userActives = this.sessionSkills.filter(isActiveSkill);
    return [...builtins, ...userActives, ...lowerLowest];
  }

  getSessionPassiveSkills(): import('../entities/PassiveSkill').PassiveSkill[] {
    return this.sessionSkills.filter(s => !isActiveSkill(s)) as import('../entities/PassiveSkill').PassiveSkill[];
  }

  getBattlePassiveSkills(): import('../entities/PassiveSkill').PassiveSkill[] {
    return this.getSessionPassiveSkills().filter(
      s => !(s.effect.type === PassiveType.STAT_MODIFIER && s.effect.stat === StatType.HP),
    );
  }

  recalcSessionMaxHp(): void {
    let maxHp = this.baseSessionMaxHp;
    for (const skill of this.getSessionPassiveSkills()) {
      if (skill.effect.type === PassiveType.STAT_MODIFIER && skill.effect.stat === StatType.HP) {
        maxHp = skill.effect.isPercentage
          ? Math.floor(maxHp * (1 + skill.effect.value))
          : maxHp + skill.effect.value;
      }
    }
    const oldMax = this.sessionMaxHp;
    this.sessionMaxHp = maxHp;
    if (oldMax > 0 && maxHp !== oldMax) {
      this.sessionCurrentHp = Math.floor(this.sessionCurrentHp * maxHp / oldMax);
    }
  }

  createCombatBattle(playerUnit: BattleUnit): Battle | null {
    if (!this.currentEncounter || this.currentEncounter.type !== EncounterType.COMBAT) {
      return null;
    }

    const dayProgress = this.getProgress();
    const pool = EnemyTable.getEnemyPoolForChapter(this.id);
    const idx1 = this.rng.nextInt(0, pool.length - 1);
    const id1 = pool[idx1];
    const template1 = EnemyTemplate.fromId(id1);
    if (!template1) return null;

    const isDual = this.rng.chance(BattleDataTable.enemy.dualSpawnChance);
    if (isDual) {
      const remaining = pool.filter(id => id !== id1);
      const idx2 = this.rng.nextInt(0, remaining.length - 1);
      const template2 = EnemyTemplate.fromId(remaining[idx2]);
      if (template2) {
        const e1 = template1.createInstance(this.id, BattleDataTable.enemy.dualStatMultiplier, dayProgress);
        const e2 = template2.createInstance(this.id, BattleDataTable.enemy.dualStatMultiplier, dayProgress);
        this.currentBattle = new Battle(playerUnit, [e1, e2], this.rng.nextInt(0, 999999));
        return this.currentBattle;
      }
    }

    const enemy = template1.createInstance(this.id, 1.0, dayProgress);
    this.currentBattle = new Battle(playerUnit, enemy, this.rng.nextInt(0, 999999));
    return this.currentBattle;
  }

  createEliteBattle(playerUnit: BattleUnit): Battle | null {
    const assignment = EnemyTable.getBossAssignmentForChapter(this.id);
    const template = EnemyTemplate.fromId(assignment.elite);
    if (!template) return null;

    const elite = template.createInstance(this.id, 1.0, this.getProgress());
    this.currentBattle = new Battle(playerUnit, elite, this.rng.nextInt(0, 999999));
    return this.currentBattle;
  }

  createMidBossBattle(playerUnit: BattleUnit): Battle | null {
    const assignment = EnemyTable.getBossAssignmentForChapter(this.id);
    const template = EnemyTemplate.fromId(assignment.midBoss);
    if (!template) return null;

    const boss = template.createInstance(this.id, 1.0, this.getProgress());
    this.currentBattle = new Battle(playerUnit, boss, this.rng.nextInt(0, 999999));
    return this.currentBattle;
  }

  createBossBattle(playerUnit: BattleUnit): Battle | null {
    const assignment = EnemyTable.getBossAssignmentForChapter(this.id);
    const template = EnemyTemplate.fromId(assignment.boss);
    if (!template) return null;

    const boss = template.createInstance(this.id, 1.0, this.getProgress());
    this.currentBattle = new Battle(playerUnit, boss, this.rng.nextInt(0, 999999));
    return this.currentBattle;
  }

  onBattleEnd(result: BattleState): number {
    this.currentBattle = null;

    if (result === BattleState.DEFEAT) {
      this.state = ChapterState.FAILED;
      return 0;
    }

    if (this.currentEncounter) {
      this.currentEncounter = null;
    }

    const r = BattleDataTable.combatGoldReward;
    const gold = Math.floor(r.base + r.perChapter * this.id + r.perDay * this.currentDay);
    this.sessionGold += gold;
    return gold;
  }

  onBossDefeated(): void {
    this.state = ChapterState.CLEARED;
  }

  isEliteDay(): boolean {
    const days = EncounterDataTable.forcedBattleDays;
    return this.type === ChapterType.SIXTY_DAY && this.currentDay === days.elite;
  }

  isMidBossDay(): boolean {
    const days = EncounterDataTable.forcedBattleDays;
    return this.type === ChapterType.SIXTY_DAY && this.currentDay === days.midBoss;
  }

  isOptionalEliteDay(): boolean {
    return this.optionalEliteTriggered;
  }

  private rollOptionalElite(): boolean {
    if (this.type !== ChapterType.SIXTY_DAY) return false;
    const entry = EncounterDataTable.optionalEliteDays.find(e => e.day === this.currentDay);
    if (!entry) return false;
    this.optionalEliteTriggered = this.rng.next() < entry.chance;
    return this.optionalEliteTriggered;
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
