import { PetTier, PetGrade } from '../enums';
import { Stats } from '../value-objects/Stats';
import { Result } from '../value-objects/Result';

const PET_GRADE_ORDER: PetGrade[] = [
  PetGrade.COMMON,
  PetGrade.RARE,
  PetGrade.EPIC,
  PetGrade.LEGENDARY,
  PetGrade.IMMORTAL,
];

const EXP_PER_FOOD = 10;
const EXP_PER_LEVEL = 100;
const STAT_PER_LEVEL = 2;

export class Pet {
  exp: number;

  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly tier: PetTier,
    public grade: PetGrade,
    public level: number = 1,
    public readonly basePassiveBonus: Stats = Stats.ZERO,
    exp: number = 0,
  ) {
    this.exp = exp;
  }

  feed(foodAmount: number): Result<{ levelsGained: number }> {
    if (foodAmount <= 0) {
      return Result.fail('No food to use');
    }

    const oldLevel = this.level;
    this.exp += foodAmount * EXP_PER_FOOD;

    while (this.exp >= this.getExpToNextLevel()) {
      this.exp -= this.getExpToNextLevel();
      this.level += 1;
    }

    return Result.ok({ levelsGained: this.level - oldLevel });
  }

  getExpToNextLevel(): number {
    return EXP_PER_LEVEL + (this.level - 1) * 20;
  }

  upgradeGrade(): Result<{ newGrade: PetGrade }> {
    const idx = PET_GRADE_ORDER.indexOf(this.grade);
    if (idx >= PET_GRADE_ORDER.length - 1) {
      return Result.fail('Already at max grade');
    }

    this.grade = PET_GRADE_ORDER[idx + 1];
    return Result.ok({ newGrade: this.grade });
  }

  getGlobalBonus(): Stats {
    const levelBonus = Stats.create({
      atk: this.level * STAT_PER_LEVEL,
      maxHp: this.level * STAT_PER_LEVEL * 2,
    });
    return this.basePassiveBonus.add(levelBonus);
  }

  getGradeIndex(): number {
    return PET_GRADE_ORDER.indexOf(this.grade);
  }

  isMaxGrade(): boolean {
    return this.grade === PetGrade.IMMORTAL;
  }
}
