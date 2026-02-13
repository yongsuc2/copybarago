import { describe, it, expect } from 'vitest';
import { Forge } from '../../services/Forge';
import { Equipment } from '../../domain/entities/Equipment';
import { EquipmentGrade, SlotType } from '../../domain/enums';

function makeEquipment(grade: EquipmentGrade, isS = false): Equipment {
  return new Equipment(`eq_${Math.random()}`, 'Test', SlotType.WEAPON, grade, isS);
}

describe('Forge', () => {
  const forge = new Forge();

  it('merges common weapons into uncommon', () => {
    const items = [
      makeEquipment(EquipmentGrade.COMMON),
      makeEquipment(EquipmentGrade.COMMON),
      makeEquipment(EquipmentGrade.COMMON),
    ];

    expect(forge.canMerge(items)).toBe(true);
    const result = forge.merge(items);
    expect(result.isOk()).toBe(true);
    expect(result.data?.result.grade).toBe(EquipmentGrade.UNCOMMON);
  });

  it('rejects S-grade as merge material', () => {
    const items = [
      makeEquipment(EquipmentGrade.COMMON, true),
      makeEquipment(EquipmentGrade.COMMON),
      makeEquipment(EquipmentGrade.COMMON),
    ];

    const result = forge.merge(items);
    expect(result.isFail()).toBe(true);
  });

  it('rejects different grades', () => {
    const items = [
      makeEquipment(EquipmentGrade.COMMON),
      makeEquipment(EquipmentGrade.RARE),
      makeEquipment(EquipmentGrade.COMMON),
    ];

    expect(forge.canMerge(items)).toBe(false);
  });

  it('finds merge candidates in inventory', () => {
    const inventory = [
      new Equipment('w1', 'W1', SlotType.WEAPON, EquipmentGrade.COMMON, false),
      new Equipment('w2', 'W2', SlotType.WEAPON, EquipmentGrade.COMMON, false),
      new Equipment('w3', 'W3', SlotType.WEAPON, EquipmentGrade.COMMON, false),
      new Equipment('r1', 'R1', SlotType.RING, EquipmentGrade.RARE, false),
    ];

    const candidates = forge.findMergeCandidates(inventory);
    expect(candidates.length).toBe(1);
    expect(candidates[0].length).toBe(3);
  });
});
