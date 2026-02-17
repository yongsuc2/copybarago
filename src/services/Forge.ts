import { Equipment } from '../domain/entities/Equipment';
import { EquipmentGrade, SlotType } from '../domain/enums';
import { Result } from '../domain/value-objects/Result';
import { EquipmentTable } from '../domain/data/EquipmentTable';

export class Forge {
  canMerge(equipments: Equipment[]): boolean {
    if (equipments.length < 2) return false;

    const firstGrade = equipments[0].grade;
    const firstSlot = equipments[0].slot;
    const firstSubType = equipments[0].weaponSubType;

    if (!equipments.every(e => e.grade === firstGrade && e.slot === firstSlot && e.weaponSubType === firstSubType)) {
      return false;
    }

    if (EquipmentTable.isHighGradeMerge(firstGrade)) {
      const firstMergeLevel = equipments[0].mergeLevel;
      if (!equipments.every(e => e.mergeLevel === firstMergeLevel)) return false;
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

    if (source.isS || equipments.some(e => e.isS)) {
      return Result.fail('S-grade equipment cannot be used as merge material');
    }

    if (EquipmentTable.isHighGradeMerge(source.grade)) {
      const maxEnhance = EquipmentTable.getMergeEnhanceMax();
      if (source.mergeLevel < maxEnhance) {
        const resultEquipment = new Equipment(
          `merged_${Date.now()}`,
          `${source.grade} ${source.slot}`,
          source.slot,
          source.grade,
          false,
          source.level,
          source.promoteCount,
          null,
          source.weaponSubType,
          source.mergeLevel + 1,
        );
        return Result.ok({ result: resultEquipment });
      }

      const nextGrade = EquipmentTable.getNextGrade(source.grade);
      if (!nextGrade) {
        return Result.fail('Already at max grade');
      }
      const resultEquipment = new Equipment(
        `merged_${Date.now()}`,
        `${nextGrade} ${source.slot}`,
        source.slot,
        nextGrade,
        false,
        source.level,
        source.promoteCount,
        null,
        source.weaponSubType,
        0,
      );
      return Result.ok({ result: resultEquipment });
    }

    const nextGrade = EquipmentTable.getNextGrade(source.grade);
    if (!nextGrade) {
      return Result.fail('Already at max grade');
    }

    const resultEquipment = new Equipment(
      `merged_${Date.now()}`,
      `${nextGrade} ${source.slot}`,
      source.slot,
      nextGrade,
      false,
      source.level,
      source.promoteCount,
      null,
      source.weaponSubType,
      0,
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
      const subKey = eq.slot === SlotType.WEAPON ? `_${eq.weaponSubType}` : '';
      const mlKey = EquipmentTable.isHighGradeMerge(eq.grade) ? `_ml${eq.mergeLevel}` : '';
      const key = `${eq.slot}${subKey}_${eq.grade}${mlKey}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(eq);
    }

    const result: Equipment[][] = [];
    for (const [, group] of groups) {
      const required = EquipmentTable.getMergeCount(group[0].grade);
      if (required <= 0) continue;
      for (let i = 0; i + required <= group.length; i += required) {
        result.push(group.slice(i, i + required));
      }
    }

    return result;
  }
}
