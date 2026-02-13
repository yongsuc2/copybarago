import { SlotType, TalentGrade } from '../enums';
import { Stats } from '../value-objects/Stats';
import { Talent } from './Talent';
import { Heritage } from './Heritage';
import { EquipmentSlot } from './EquipmentSlot';
import { Pet } from './Pet';
import { Resources } from './Resources';

const BASE_STATS = Stats.create({ hp: 100, maxHp: 100, atk: 10, def: 5, crit: 0.05 });

export class Player {
  talent: Talent;
  heritage: Heritage;
  equipmentSlots: Map<SlotType, EquipmentSlot>;
  activePet: Pet | null;
  ownedPets: Pet[];
  resources: Resources;
  clearedChapterMax: number;

  constructor() {
    this.talent = new Talent();
    this.heritage = new Heritage();
    this.equipmentSlots = new Map([
      [SlotType.WEAPON, new EquipmentSlot(SlotType.WEAPON)],
      [SlotType.ARMOR, new EquipmentSlot(SlotType.ARMOR)],
      [SlotType.RING, new EquipmentSlot(SlotType.RING)],
      [SlotType.ACCESSORY, new EquipmentSlot(SlotType.ACCESSORY)],
    ]);
    this.activePet = null;
    this.ownedPets = [];
    this.resources = new Resources();
    this.clearedChapterMax = 0;
  }

  computeStats(): Stats {
    let stats = BASE_STATS.clone();

    stats = stats.add(this.talent.getStats());

    for (const slot of this.equipmentSlots.values()) {
      stats = stats.add(slot.getTotalStats());
    }

    if (this.isHeritageUnlocked()) {
      stats = stats.add(this.heritage.getPassiveBonus());
    }

    if (this.activePet) {
      stats = stats.add(this.activePet.getGlobalBonus());
    }

    for (const pet of this.ownedPets) {
      if (pet !== this.activePet) {
        const passiveOnly = Stats.create({
          atk: Math.floor(pet.getGlobalBonus().atk * 0.1),
          maxHp: Math.floor(pet.getGlobalBonus().maxHp * 0.1),
        });
        stats = stats.add(passiveOnly);
      }
    }

    stats = stats.withHp(stats.maxHp);

    return stats;
  }

  isHeritageUnlocked(): boolean {
    return Heritage.isUnlocked(this.talent.grade);
  }

  getEquipmentSlot(slotType: SlotType): EquipmentSlot {
    return this.equipmentSlots.get(slotType)!;
  }

  setActivePet(pet: Pet): void {
    this.activePet = pet;
  }

  addPet(pet: Pet): void {
    this.ownedPets.push(pet);
  }

  getTalentGrade(): TalentGrade {
    return this.talent.grade;
  }
}
