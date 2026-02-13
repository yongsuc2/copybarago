import { StatType, TalentGrade } from '../enums';
import { Stats } from '../value-objects/Stats';
import { Result } from '../value-objects/Result';
import { TalentTable } from '../data/TalentTable';

export class Talent {
  atkLevel: number;
  hpLevel: number;
  defLevel: number;
  grade: TalentGrade;

  constructor(
    atkLevel: number = 0,
    hpLevel: number = 0,
    defLevel: number = 0,
  ) {
    this.atkLevel = atkLevel;
    this.hpLevel = hpLevel;
    this.defLevel = defLevel;
    this.grade = this.computeGrade();
  }

  private getLevel(statType: StatType): number {
    switch (statType) {
      case StatType.ATK: return this.atkLevel;
      case StatType.HP: return this.hpLevel;
      case StatType.DEF: return this.defLevel;
      default: return 0;
    }
  }

  private setLevel(statType: StatType, level: number): void {
    switch (statType) {
      case StatType.ATK: this.atkLevel = level; break;
      case StatType.HP: this.hpLevel = level; break;
      case StatType.DEF: this.defLevel = level; break;
    }
  }

  getTotalLevel(): number {
    return this.atkLevel + this.hpLevel + this.defLevel;
  }

  private computeGrade(): TalentGrade {
    return TalentTable.getGradeForTotalLevel(this.getTotalLevel());
  }

  getUpgradeCost(statType: StatType): number {
    const level = this.getLevel(statType);
    return TalentTable.getUpgradeCost(level);
  }

  upgrade(statType: StatType, availableGold: number): Result<{ cost: number; newLevel: number; gradeChanged: boolean }> {
    if (statType === StatType.CRIT) {
      return Result.fail('CRIT cannot be upgraded via talent');
    }

    const cost = this.getUpgradeCost(statType);
    if (availableGold < cost) {
      return Result.fail('Not enough gold');
    }

    const oldGrade = this.grade;
    this.setLevel(statType, this.getLevel(statType) + 1);
    this.grade = this.computeGrade();

    return Result.ok({
      cost,
      newLevel: this.getLevel(statType),
      gradeChanged: oldGrade !== this.grade,
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
}
