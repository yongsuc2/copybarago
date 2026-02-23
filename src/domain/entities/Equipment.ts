import { EquipmentGrade, SlotType, WeaponSubType } from '../enums';
import { Stats } from '../value-objects/Stats';
import { Result } from '../value-objects/Result';
import { EquipmentTable } from '../data/EquipmentTable';
import type { SubStat } from '../data/EquipmentSubStatTable';

export interface UniqueEffect {
  description: string;
  statBonus: Stats;
}

export class Equipment {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly slot: SlotType,
    public grade: EquipmentGrade,
    public readonly isS: boolean,
    public level: number = 0,
    public promoteCount: number = 0,
    public readonly uniqueEffect: UniqueEffect | null = null,
    public readonly weaponSubType: WeaponSubType | null = null,
    public mergeLevel: number = 0,
    public readonly subStats: SubStat[] = [],
  ) {}

  getStats(): Stats {
    const baseStats = EquipmentTable.getBaseStats(this.slot, this.grade);
    const flat = EquipmentTable.getUpgradeFlatPerLevel();
    const bonus = Stats.create({
      atk: baseStats.atk > 0 ? this.level * flat : 0,
      maxHp: baseStats.maxHp > 0 ? this.level * flat : 0,
    });
    let stats = baseStats.add(bonus);
    if (this.uniqueEffect) {
      stats = stats.add(this.uniqueEffect.statBonus);
    }
    for (const sub of this.subStats) {
      stats = stats.add(Stats.create({ [sub.stat]: sub.value }));
    }
    return stats;
  }

  getUpgradeCost(): number {
    return EquipmentTable.getUpgradeCost(this.level);
  }

  upgrade(availableStones: number): Result<{ cost: number; newLevel: number }> {
    const cost = this.getUpgradeCost();
    if (availableStones < cost) {
      return Result.fail('Not enough equipment stones');
    }

    if (this.needsPromote()) {
      return Result.fail('Promotion required before further upgrade');
    }

    this.level += 1;
    return Result.ok({ cost, newLevel: this.level });
  }

  needsPromote(): boolean {
    return EquipmentTable.canPromoteAtLevel(this.level) && this.promoteCount <= EquipmentTable.getPromoteLevels().indexOf(this.level);
  }

  canPromote(): boolean {
    return EquipmentTable.canPromoteAtLevel(this.level);
  }

  promote(availablePowerStones: number): Result<{ cost: number }> {
    if (!this.canPromote()) {
      return Result.fail('Cannot promote at current level');
    }

    const cost = 1;
    if (availablePowerStones < cost) {
      return Result.fail('Not enough power stones');
    }

    this.promoteCount += 1;
    return Result.ok({ cost });
  }

  getTotalUpgradeCost(): number {
    return EquipmentTable.getTotalUpgradeCost(this.level);
  }

  demote(): Result<{ refund: number }> {
    if (this.level === 0) {
      return Result.fail('Already at level 0');
    }
    const refund = this.getTotalUpgradeCost();
    this.level = 0;
    this.promoteCount = 0;
    return Result.ok({ refund });
  }

  transferLevelTo(target: Equipment): void {
    target.level = this.level;
    target.promoteCount = this.promoteCount;
  }

  getGradeIndex(): number {
    return EquipmentTable.getGradeIndex(this.grade);
  }

  isBetterThan(other: Equipment): boolean {
    if (this.getGradeIndex() !== other.getGradeIndex()) {
      return this.getGradeIndex() > other.getGradeIndex();
    }
    if (this.isS !== other.isS) {
      return this.isS;
    }
    return this.level > other.level;
  }
}
