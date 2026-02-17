import { describe, it, expect } from 'vitest';
import { TreasureChest } from '../../domain/economy/TreasureChest';
import { ChestType, EquipmentGrade } from '../../domain/enums';
import { SeededRandom } from '../../infrastructure/SeededRandom';

describe('TreasureChest', () => {
  it('equipment chest costs 150 per pull', () => {
    const chest = new TreasureChest(ChestType.EQUIPMENT);
    expect(chest.getCostPerPull()).toBe(150);
  });

  it('pull10 costs 9x single pull', () => {
    const chest = new TreasureChest(ChestType.EQUIPMENT);
    expect(chest.getPull10Cost()).toBe(150 * 9);
  });

  it('pull returns equipment', () => {
    const chest = new TreasureChest(ChestType.EQUIPMENT);
    const rng = new SeededRandom(42);
    const result = chest.pull(rng);

    expect(result.equipment).not.toBeNull();
    expect(result.equipment!.grade).toBeDefined();
  });

  it('pull10 returns 10 results', () => {
    const chest = new TreasureChest(ChestType.EQUIPMENT);
    const rng = new SeededRandom(42);
    const results = chest.pull10(rng);

    expect(results.length).toBe(10);
  });

  it('pity counter increments on each pull', () => {
    const chest = new TreasureChest(ChestType.EQUIPMENT);
    const rng = new SeededRandom(42);

    chest.pull(rng);
    expect(chest.pityCount).toBe(1);

    chest.pull(rng);
    expect(chest.pityCount).toBe(2);
  });

  it('pity triggers at 180 pulls with mythic reward', () => {
    const chest = new TreasureChest(ChestType.EQUIPMENT);
    const rng = new SeededRandom(42);

    for (let i = 0; i < 179; i++) {
      chest.pull(rng);
    }
    expect(chest.pityCount).toBe(179);

    const pityResult = chest.pull(rng);
    expect(pityResult.isPity).toBe(true);
    expect(pityResult.equipment!.grade).toBe(EquipmentGrade.MYTHIC);
    expect(chest.pityCount).toBe(0);
  });

  it('pet chest returns pet resources', () => {
    const chest = new TreasureChest(ChestType.PET);
    const rng = new SeededRandom(42);
    const result = chest.pull(rng);

    expect(result.equipment).toBeNull();
    expect(result.resources.length).toBeGreaterThan(0);
  });

  it('pity progress tracks correctly', () => {
    const chest = new TreasureChest(ChestType.EQUIPMENT);
    const rng = new SeededRandom(42);

    for (let i = 0; i < 90; i++) {
      chest.pull(rng);
    }

    expect(chest.getPityProgress()).toBeCloseTo(0.5);
    expect(chest.getRemainingToPity()).toBe(90);
  });

  it('grade distribution follows synthesis ratio weights', () => {
    const chest = new TreasureChest(ChestType.EQUIPMENT);
    const rng = new SeededRandom(12345);
    const counts: Record<string, number> = {};

    for (let i = 0; i < 3640; i++) {
      const result = chest.pull(rng);
      if (result.equipment) {
        const grade = result.equipment.grade;
        counts[grade] = (counts[grade] || 0) + 1;
      }
    }

    expect(counts[EquipmentGrade.COMMON]).toBeGreaterThan(counts[EquipmentGrade.UNCOMMON]);
    expect(counts[EquipmentGrade.UNCOMMON]).toBeGreaterThan(counts[EquipmentGrade.RARE]);
    expect(counts[EquipmentGrade.RARE]).toBeGreaterThan(counts[EquipmentGrade.EPIC] || 0);
  });
});
