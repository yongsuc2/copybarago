import { describe, it, expect } from 'vitest';
import { TreasureChest } from '../../domain/economy/TreasureChest';
import { ChestType, EquipmentGrade } from '../../domain/enums';
import { SeededRandom } from '../../infrastructure/SeededRandom';

describe('TreasureChest', () => {
  it('gold chest costs 298 per pull', () => {
    const chest = new TreasureChest(ChestType.GOLD);
    expect(chest.getCostPerPull()).toBe(298);
  });

  it('pull10 costs 9x single pull', () => {
    const chest = new TreasureChest(ChestType.GOLD);
    expect(chest.getPull10Cost()).toBe(298 * 9);
  });

  it('pull returns equipment', () => {
    const chest = new TreasureChest(ChestType.GOLD);
    const rng = new SeededRandom(42);
    const result = chest.pull(rng);

    expect(result.equipment).not.toBeNull();
    expect(result.equipment!.grade).toBeDefined();
  });

  it('pull10 returns 10 results', () => {
    const chest = new TreasureChest(ChestType.GOLD);
    const rng = new SeededRandom(42);
    const results = chest.pull10(rng);

    expect(results.length).toBe(10);
  });

  it('pity counter increments on each pull', () => {
    const chest = new TreasureChest(ChestType.GOLD);
    const rng = new SeededRandom(42);

    chest.pull(rng);
    expect(chest.pityCount).toBe(1);

    chest.pull(rng);
    expect(chest.pityCount).toBe(2);
  });

  it('pity triggers at 180 pulls for gold chest', () => {
    const chest = new TreasureChest(ChestType.GOLD);
    const rng = new SeededRandom(42);

    for (let i = 0; i < 179; i++) {
      chest.pull(rng);
    }
    expect(chest.pityCount).toBe(179);

    const pityResult = chest.pull(rng);
    expect(pityResult.isPity).toBe(true);
    expect(pityResult.equipment!.isS).toBe(true);
    expect(pityResult.equipment!.grade).toBe(EquipmentGrade.EPIC);
    expect(chest.pityCount).toBe(0);
  });

  it('bronze chest has no pity', () => {
    const chest = new TreasureChest(ChestType.BRONZE);
    expect(chest.getPityThreshold()).toBe(0);
  });

  it('pet chest returns pet resources', () => {
    const chest = new TreasureChest(ChestType.PET);
    const rng = new SeededRandom(42);
    const result = chest.pull(rng);

    expect(result.equipment).toBeNull();
    expect(result.resources.length).toBeGreaterThan(0);
  });

  it('pity progress tracks correctly', () => {
    const chest = new TreasureChest(ChestType.GOLD);
    const rng = new SeededRandom(42);

    for (let i = 0; i < 90; i++) {
      chest.pull(rng);
    }

    expect(chest.getPityProgress()).toBeCloseTo(0.5);
    expect(chest.getRemainingToPity()).toBe(90);
  });
});
