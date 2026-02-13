import { Equipment } from '../domain/entities/Equipment';
import { EquipmentGrade } from '../domain/enums';
import { Result } from '../domain/value-objects/Result';
import { EquipmentTable } from '../domain/data/EquipmentTable';

export class Forge {
  canMerge(equipments: Equipment[]): boolean {
    if (equipments.length < 2) return false;

    const firstGrade = equipments[0].grade;
    const firstSlot = equipments[0].slot;

    if (!equipments.every(e => e.grade === firstGrade && e.slot === firstSlot)) {
      return false;
    }

    const required = EquipmentTable.getMergeCount(firstGrade);
    if (required === 0) return false;

    return equipments.length >= required;
  }

  merge(equipments: Equipment[]): Result<{ result: Equipment }> {
    if (!this.canMerge(equipments)) {
      return Result.fail('Cannot merge these equipments');
    }

    const source = equipments[0];
    const nextGrade = EquipmentTable.getNextGrade(source.grade);
    if (!nextGrade) {
      return Result.fail('Already at max grade');
    }

    if (source.isS || equipments.some(e => e.isS)) {
      return Result.fail('S-grade equipment cannot be used as merge material');
    }

    const isEpicOrAbove = EquipmentTable.getGradeIndex(source.grade) >= EquipmentTable.getGradeIndex(EquipmentGrade.EPIC);

    let resultGrade = nextGrade;
    let upgradeCount = 0;

    if (isEpicOrAbove) {
      upgradeCount = Math.min((source.upgradeCount || 0) + 1, 4);
      if (upgradeCount >= 4) {
        resultGrade = nextGrade;
        upgradeCount = 0;
      } else {
        resultGrade = source.grade;
      }
    }

    const resultEquipment = new Equipment(
      `merged_${Date.now()}`,
      `${resultGrade} ${source.slot}`,
      source.slot,
      resultGrade,
      false,
      source.level,
      upgradeCount,
      source.promoteCount,
    );

    return Result.ok({ result: resultEquipment });
  }

  getMergeRequirement(grade: EquipmentGrade): number {
    return EquipmentTable.getMergeCount(grade);
  }

  findMergeCandidates(inventory: Equipment[]): Equipment[][] {
    const groups = new Map<string, Equipment[]>();

    for (const eq of inventory) {
      if (eq.isS) continue;
      const key = `${eq.slot}_${eq.grade}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(eq);
    }

    const result: Equipment[][] = [];
    for (const [, group] of groups) {
      const required = EquipmentTable.getMergeCount(group[0].grade);
      if (required > 0 && group.length >= required) {
        result.push(group.slice(0, required));
      }
    }

    return result;
  }
}
