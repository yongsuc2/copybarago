import { StatType, TalentGrade } from '../enums';
import { Stats } from '../value-objects/Stats';
import { Result } from '../value-objects/Result';
import { TalentTable, type TalentMilestone } from '../data/TalentTable';

export class Talent {
  private _subGradeIndex: number;
  private _atkLevel: number;
  private _hpLevel: number;
  private _defLevel: number;
  grade: TalentGrade;

  constructor(atkLevel = 0, hpLevel = 0, defLevel = 0) {
    const perStat = TalentTable.getLevelsPerStat();
    this._subGradeIndex = Math.min(
      Math.floor(atkLevel / perStat),
      Math.floor(hpLevel / perStat),
      Math.floor(defLevel / perStat),
    );
    this._atkLevel = Math.min(atkLevel - this._subGradeIndex * perStat, perStat);
    this._hpLevel = Math.min(hpLevel - this._subGradeIndex * perStat, perStat);
    this._defLevel = Math.min(defLevel - this._subGradeIndex * perStat, perStat);
    this.grade = this.computeGrade();
  }

  get atkLevel(): number {
    return this._subGradeIndex * TalentTable.getLevelsPerStat() + this._atkLevel;
  }

  get hpLevel(): number {
    return this._subGradeIndex * TalentTable.getLevelsPerStat() + this._hpLevel;
  }

  get defLevel(): number {
    return this._subGradeIndex * TalentTable.getLevelsPerStat() + this._defLevel;
  }

  get subGradeIndex(): number {
    return this._subGradeIndex;
  }

  getStatLevelInTier(statType: StatType): number {
    switch (statType) {
      case StatType.ATK: return this._atkLevel;
      case StatType.HP: return this._hpLevel;
      case StatType.DEF: return this._defLevel;
      default: return 0;
    }
  }

  private setStatInTier(statType: StatType, level: number): void {
    switch (statType) {
      case StatType.ATK: this._atkLevel = level; break;
      case StatType.HP: this._hpLevel = level; break;
      case StatType.DEF: this._defLevel = level; break;
    }
  }

  getTotalLevel(): number {
    return this.atkLevel + this.hpLevel + this.defLevel;
  }

  private computeGrade(): TalentGrade {
    return TalentTable.getGradeForTotalLevel(this.getTotalLevel());
  }

  getUpgradeCost(_statType: StatType): number {
    return TalentTable.getUpgradeCost(this.getTotalLevel());
  }

  canUpgradeStat(statType: StatType): boolean {
    if (statType === StatType.CRIT) return false;
    if (this.getTotalLevel() >= TalentTable.getMaxLevel()) return false;
    return this.getStatLevelInTier(statType) < TalentTable.getLevelsPerStat();
  }

  upgrade(statType: StatType, availableGold: number): Result<{
    cost: number; newLevel: number; gradeChanged: boolean; subGradeAdvanced: boolean;
  }> {
    if (statType === StatType.CRIT) {
      return Result.fail('CRIT cannot be upgraded via talent');
    }

    if (!this.canUpgradeStat(statType)) {
      return Result.fail('Stat at max for current sub-grade');
    }

    const cost = this.getUpgradeCost(statType);
    if (availableGold < cost) {
      return Result.fail('Not enough gold');
    }

    const oldGrade = this.grade;
    const perStat = TalentTable.getLevelsPerStat();
    this.setStatInTier(statType, this.getStatLevelInTier(statType) + 1);

    let subGradeAdvanced = false;
    if (this._atkLevel >= perStat && this._hpLevel >= perStat && this._defLevel >= perStat) {
      this._subGradeIndex++;
      this._atkLevel = 0;
      this._hpLevel = 0;
      this._defLevel = 0;
      subGradeAdvanced = true;
    }

    this.grade = this.computeGrade();

    return Result.ok({
      cost,
      newLevel: this.getStatLevelInTier(statType),
      gradeChanged: oldGrade !== this.grade,
      subGradeAdvanced,
    });
  }

  getStats(): Stats {
    const hp = this.hpLevel * TalentTable.getStatPerLevel(StatType.HP);
    const atk = this.atkLevel * TalentTable.getStatPerLevel(StatType.ATK);
    const def = this.defLevel * TalentTable.getStatPerLevel(StatType.DEF);
    return Stats.create({ maxHp: hp, hp, atk, def });
  }

  getNextGradeThreshold(): number | null {
    return TalentTable.getNextGradeThreshold(this.grade);
  }

  isMaxGrade(): boolean {
    return this.grade === TalentGrade.HERO;
  }

  getMilestoneKey(level: number): string {
    return `LV_${level}`;
  }

  getClaimableMilestones(claimedMilestones: Set<string>): TalentMilestone[] {
    const totalLevel = this.getTotalLevel();
    return TalentTable.getAllMilestones().filter(m =>
      totalLevel >= m.level && !claimedMilestones.has(`LV_${m.level}`),
    );
  }

  isMilestoneReached(level: number): boolean {
    return this.getTotalLevel() >= level;
  }
}
