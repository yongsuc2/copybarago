import { describe, it, expect } from 'vitest';
import { Player } from '../../domain/entities/Player';
import { Equipment } from '../../domain/entities/Equipment';
import { Pet } from '../../domain/entities/Pet';
import { EquipmentGrade, SlotType, PetTier, PetGrade, StatType, ResourceType } from '../../domain/enums';
import { Stats } from '../../domain/value-objects/Stats';

describe('Player', () => {
  it('starts with base stats', () => {
    const player = new Player();
    const stats = player.computeStats();

    expect(stats.maxHp).toBeGreaterThan(0);
    expect(stats.atk).toBeGreaterThan(0);
    expect(stats.def).toBeGreaterThan(0);
  });

  it('talent upgrade increases computed stats', () => {
    const player = new Player();
    const baseStat = player.computeStats();

    player.resources.setAmount(ResourceType.GOLD, 100000);
    player.talent.upgrade(StatType.ATK, 100000);
    player.talent.upgrade(StatType.ATK, 100000);
    player.talent.upgrade(StatType.ATK, 100000);

    const newStats = player.computeStats();
    expect(newStats.atk).toBeGreaterThan(baseStat.atk);
  });

  it('equipping weapon increases ATK', () => {
    const player = new Player();
    const baseStat = player.computeStats();

    const weapon = new Equipment('w1', 'Sword', SlotType.WEAPON, EquipmentGrade.EPIC, false);
    player.getEquipmentSlot(SlotType.WEAPON).equip(weapon);

    const newStats = player.computeStats();
    expect(newStats.atk).toBeGreaterThan(baseStat.atk);
  });

  it('active pet adds stats', () => {
    const player = new Player();
    const baseStat = player.computeStats();

    const pet = new Pet('p1', 'Elsa', PetTier.S, PetGrade.LEGENDARY, 5, Stats.create({ atk: 10, maxHp: 50 }));
    player.addPet(pet);
    player.setActivePet(pet);

    const newStats = player.computeStats();
    expect(newStats.atk).toBeGreaterThan(baseStat.atk);
    expect(newStats.maxHp).toBeGreaterThan(baseStat.maxHp);
  });

  it('inactive pets provide reduced passive bonus', () => {
    const player = new Player();

    const activePet = new Pet('p1', 'Active', PetTier.S, PetGrade.LEGENDARY, 5, Stats.create({ atk: 10 }));
    const inactivePet = new Pet('p2', 'Inactive', PetTier.A, PetGrade.EPIC, 5, Stats.create({ atk: 10 }));

    player.addPet(activePet);
    player.addPet(inactivePet);
    player.setActivePet(activePet);

    const statsWithInactive = player.computeStats();

    const playerNoInactive = new Player();
    playerNoInactive.addPet(activePet);
    playerNoInactive.setActivePet(activePet);
    const statsWithoutInactive = playerNoInactive.computeStats();

    expect(statsWithInactive.atk).toBeGreaterThan(statsWithoutInactive.atk);
  });

  it('hp equals maxHp after computeStats', () => {
    const player = new Player();
    const stats = player.computeStats();
    expect(stats.hp).toBe(stats.maxHp);
  });
});
