import { describe, it, expect } from 'vitest';
import { Equipment } from '../../domain/entities/Equipment';
import { EquipmentSlot } from '../../domain/entities/EquipmentSlot';
import { EquipmentGrade, SlotType } from '../../domain/enums';

describe('Equipment', () => {
  it('computes stats based on grade and slot', () => {
    const weapon = new Equipment('w1', 'Iron Sword', SlotType.WEAPON, EquipmentGrade.COMMON, false);
    const stats = weapon.getStats();
    expect(stats.atk).toBeGreaterThan(0);
  });

  it('stats increase with level upgrade', () => {
    const weapon = new Equipment('w1', 'Iron Sword', SlotType.WEAPON, EquipmentGrade.EPIC, false);
    const baseStats = weapon.getStats();

    for (let i = 0; i < 5; i++) {
      weapon.upgrade(10);
    }
    const upgradedStats = weapon.getStats();
    expect(upgradedStats.atk).toBeGreaterThan(baseStats.atk);
  });

  it('S-grade is better than non-S at same grade', () => {
    const normal = new Equipment('w1', 'Sword', SlotType.WEAPON, EquipmentGrade.EPIC, false);
    const sGrade = new Equipment('w2', 'S-Sword', SlotType.WEAPON, EquipmentGrade.EPIC, true);
    expect(sGrade.isBetterThan(normal)).toBe(true);
  });

  it('higher grade is always better', () => {
    const epic = new Equipment('w1', 'Epic Sword', SlotType.WEAPON, EquipmentGrade.EPIC, false);
    const legendary = new Equipment('w2', 'Legend Sword', SlotType.WEAPON, EquipmentGrade.LEGENDARY, false);
    expect(legendary.isBetterThan(epic)).toBe(true);
  });

  it('transfers level to another equipment', () => {
    const old = new Equipment('w1', 'Old', SlotType.WEAPON, EquipmentGrade.COMMON, false, 15, 0, 1);
    const newer = new Equipment('w2', 'New', SlotType.WEAPON, EquipmentGrade.RARE, false);

    old.transferLevelTo(newer);
    expect(newer.level).toBe(15);
    expect(newer.promoteCount).toBe(1);
  });
});

describe('EquipmentSlot', () => {
  it('equips and unequips correctly', () => {
    const slot = new EquipmentSlot(SlotType.WEAPON);
    const weapon = new Equipment('w1', 'Sword', SlotType.WEAPON, EquipmentGrade.COMMON, false);

    const result = slot.equip(weapon);
    expect(result.isOk()).toBe(true);
    expect(slot.getEquipped().length).toBe(1);

    const unequipResult = slot.unequip(0);
    expect(unequipResult.isOk()).toBe(true);
    expect(slot.getEquipped().length).toBe(0);
  });

  it('ring slot allows 2 equipment', () => {
    const slot = new EquipmentSlot(SlotType.RING);
    const ring1 = new Equipment('r1', 'Ring1', SlotType.RING, EquipmentGrade.COMMON, false);
    const ring2 = new Equipment('r2', 'Ring2', SlotType.RING, EquipmentGrade.COMMON, false);

    slot.equip(ring1, 0);
    slot.equip(ring2, 1);
    expect(slot.getEquipped().length).toBe(2);
  });

  it('rejects equipment with wrong slot type', () => {
    const slot = new EquipmentSlot(SlotType.WEAPON);
    const ring = new Equipment('r1', 'Ring', SlotType.RING, EquipmentGrade.COMMON, false);

    const result = slot.equip(ring);
    expect(result.isFail()).toBe(true);
  });

  it('computes total stats from all equipped', () => {
    const slot = new EquipmentSlot(SlotType.RING);
    const ring1 = new Equipment('r1', 'Ring1', SlotType.RING, EquipmentGrade.COMMON, false);
    const ring2 = new Equipment('r2', 'Ring2', SlotType.RING, EquipmentGrade.RARE, false);

    slot.equip(ring1, 0);
    slot.equip(ring2, 1);

    const stats = slot.getTotalStats();
    expect(stats.atk).toBeGreaterThan(0);
  });
});
