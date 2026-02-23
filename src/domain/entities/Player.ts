import { EffectType, EquipmentGrade, ResourceType, SlotType, StatusEffectType, TalentGrade } from '../enums';
import { Stats } from '../value-objects/Stats';
import { Talent } from './Talent';
import { Heritage } from './Heritage';
import { Equipment } from './Equipment';
import { EquipmentSlot } from './EquipmentSlot';
import { Pet } from './Pet';
import { Resources } from './Resources';
import { ChapterTreasureTable } from '../data/ChapterTreasureTable';
import { BattleDataTable } from '../data/BattleDataTable';
import { TalentTable } from '../data/TalentTable';

const SELL_PRICES: Record<EquipmentGrade, number> = {
  [EquipmentGrade.COMMON]: 10,
  [EquipmentGrade.UNCOMMON]: 30,
  [EquipmentGrade.RARE]: 100,
  [EquipmentGrade.EPIC]: 300,
  [EquipmentGrade.LEGENDARY]: 1000,
  [EquipmentGrade.MYTHIC]: 3000,
};

export const BASE_STATS = Stats.create({ hp: 100, maxHp: 100, atk: 10, def: 5, crit: 0 });

export interface StatsBreakdown {
  base: Stats;
  talent: Stats;
  equipment: Stats;
  heritage: Stats;
  pet: Stats;
  talentGrade: Stats;
  total: Stats;
}

export interface CombatPassives {
  critDamage: number;
  lifestealRate: number;
  evasionRate: number;
  shieldPercent: number;
  multiHitChance: number;
  regenPercent: number;
  counterChance: number;
  atkUpBuff: number;
  critUpBuff: number;
  defUpBuff: number;
  magicBoost: number;
  rageBoost: number;
}

export class Player {
  talent: Talent;
  heritage: Heritage;
  equipmentSlots: Map<SlotType, EquipmentSlot>;
  inventory: Equipment[];
  activePet: Pet | null;
  ownedPets: Pet[];
  resources: Resources;
  clearedChapterMax: number;
  bestSurvivalDays: Map<number, number>;
  claimedMilestones: Set<string>;

  constructor() {
    this.talent = new Talent();
    this.heritage = new Heritage();
    this.equipmentSlots = new Map([
      [SlotType.WEAPON, new EquipmentSlot(SlotType.WEAPON)],
      [SlotType.ARMOR, new EquipmentSlot(SlotType.ARMOR)],
      [SlotType.RING, new EquipmentSlot(SlotType.RING)],
      [SlotType.NECKLACE, new EquipmentSlot(SlotType.NECKLACE)],
      [SlotType.SHOES, new EquipmentSlot(SlotType.SHOES)],
      [SlotType.GLOVES, new EquipmentSlot(SlotType.GLOVES)],
      [SlotType.HAT, new EquipmentSlot(SlotType.HAT)],
    ]);
    this.inventory = [];
    this.activePet = null;
    this.ownedPets = [];
    this.resources = new Resources();
    this.clearedChapterMax = 0;
    this.bestSurvivalDays = new Map();
    this.claimedMilestones = new Set();
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

    const gradeBonus = TalentTable.getCumulativeGradeBonus(this.talent.grade);
    stats = Stats.create({
      hp: stats.hp,
      maxHp: Math.floor(stats.maxHp * (1 + gradeBonus.hpPercent)),
      atk: Math.floor(stats.atk * (1 + gradeBonus.atkPercent)),
      def: Math.floor(stats.def * (1 + gradeBonus.defPercent)),
      crit: stats.crit,
    });

    stats = stats.withHp(stats.maxHp);

    return stats;
  }

  getGoldMultiplier(): number {
    const gradeBonus = TalentTable.getCumulativeGradeBonus(this.talent.grade);
    return 1 + gradeBonus.goldPercent;
  }

  getStatsBreakdown(): StatsBreakdown {
    const base = BASE_STATS.clone();
    const talent = this.talent.getStats();

    let equipment = Stats.ZERO;
    for (const slot of this.equipmentSlots.values()) {
      equipment = equipment.add(slot.getTotalStats());
    }

    const heritage = this.isHeritageUnlocked() ? this.heritage.getPassiveBonus() : Stats.ZERO;

    let pet = Stats.ZERO;
    if (this.activePet) {
      pet = pet.add(this.activePet.getGlobalBonus());
    }
    for (const p of this.ownedPets) {
      if (p !== this.activePet) {
        pet = pet.add(Stats.create({
          atk: Math.floor(p.getGlobalBonus().atk * 0.1),
          maxHp: Math.floor(p.getGlobalBonus().maxHp * 0.1),
        }));
      }
    }

    let flatTotal = base.add(talent).add(equipment).add(heritage).add(pet);

    const gradeBonus = TalentTable.getCumulativeGradeBonus(this.talent.grade);
    const talentGrade = Stats.create({
      maxHp: Math.floor(flatTotal.maxHp * gradeBonus.hpPercent),
      atk: Math.floor(flatTotal.atk * gradeBonus.atkPercent),
      def: Math.floor(flatTotal.def * gradeBonus.defPercent),
    });

    let total = flatTotal.add(talentGrade);
    total = total.withHp(total.maxHp);

    return { base, talent, equipment, heritage, pet, talentGrade, total };
  }

  getCombatPassives(): CombatPassives {
    const result: CombatPassives = {
      critDamage: BattleDataTable.damage.critMultiplier,
      lifestealRate: 0,
      evasionRate: 0,
      shieldPercent: 0,
      multiHitChance: 0,
      regenPercent: 0,
      counterChance: 0,
      atkUpBuff: 0,
      critUpBuff: 0,
      defUpBuff: 0,
      magicBoost: 0,
      rageBoost: 0,
    };

    for (const slot of this.equipmentSlots.values()) {
      for (const eq of slot.getEquipped()) {
        const passive = eq.getPassive();
        if (!passive) continue;

        switch (passive.effectType) {
          case EffectType.SHIELD:
            result.shieldPercent += passive.value;
            break;
          case EffectType.MULTI_HIT:
            result.multiHitChance += passive.value;
            break;
          case EffectType.HOT:
            result.regenPercent += passive.value;
            break;
          case EffectType.MAGIC_BOOST:
            result.magicBoost += passive.value;
            break;
          case EffectType.RAGE_BOOST:
            result.rageBoost += passive.value;
            break;
          case EffectType.BUFF:
            if (passive.statusEffectType === StatusEffectType.ATK_UP) {
              result.atkUpBuff += passive.value;
            } else if (passive.statusEffectType === StatusEffectType.CRIT_UP) {
              result.critUpBuff += passive.value;
            } else if (passive.statusEffectType === StatusEffectType.DEF_UP) {
              result.defUpBuff += passive.value;
            }
            break;
        }
      }
    }

    return result;
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

  addToInventory(equipment: Equipment): void {
    this.inventory.push(equipment);
  }

  removeFromInventory(id: string): Equipment | null {
    const index = this.inventory.findIndex(e => e.id === id);
    if (index === -1) return null;
    return this.inventory.splice(index, 1)[0];
  }

  sellEquipment(id: string): number {
    const eq = this.inventory.find(e => e.id === id);
    if (!eq || eq.isS) return 0;
    const price = SELL_PRICES[eq.grade];
    this.removeFromInventory(id);
    this.resources.add(ResourceType.GOLD, price);
    return price;
  }

  equipFromInventory(id: string): Equipment | null {
    const eq = this.removeFromInventory(id);
    if (!eq) return null;

    const slot = this.getEquipmentSlot(eq.slot);

    const emptyIndex = slot.getFirstEmptyIndex();
    if (emptyIndex >= 0) {
      slot.equip(eq, emptyIndex);
      return null;
    }

    let worstIndex = 0;
    for (let i = 1; i < slot.maxCount; i++) {
      const current = slot.equipped[i];
      const worst = slot.equipped[worstIndex];
      if (current && worst && worst.isBetterThan(current)) {
        worstIndex = i;
      }
    }

    const result = slot.equip(eq, worstIndex);
    if (result.isOk() && result.data?.replaced) {
      this.addToInventory(result.data.replaced);
      return result.data.replaced;
    }
    return null;
  }

  unequipToInventory(slotType: SlotType, index: number): boolean {
    const slot = this.getEquipmentSlot(slotType);
    const result = slot.unequip(index);
    if (result.isFail() || !result.data) return false;
    this.addToInventory(result.data.equipment);
    return true;
  }

  getTalentGrade(): TalentGrade {
    return this.talent.grade;
  }

  updateBestSurvivalDay(chapterId: number, day: number, cleared: boolean): void {
    const effectiveDay = cleared
      ? ChapterTreasureTable.getClearSentinelDay(chapterId)
      : day;
    const current = this.bestSurvivalDays.get(chapterId) ?? 0;
    if (effectiveDay > current) {
      this.bestSurvivalDays.set(chapterId, effectiveDay);
    }
  }
}
