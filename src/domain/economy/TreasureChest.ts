import { ChestType, EquipmentGrade, ResourceType, SlotType, WeaponSubType } from '../enums';
import { Equipment } from '../entities/Equipment';
import type { SeededRandom } from '../../infrastructure/SeededRandom';
import { EquipmentDataTable } from '../data/EquipmentDataTable';
import gachaData from '../data/json/gacha.data.json';

interface ChestConfig {
  type: ChestType;
  costPerPull: number;
  pityThreshold: number;
  gradeWeights: { grade: EquipmentGrade; weight: number }[];
}

const CHEST_CONFIGS: Record<ChestType, ChestConfig> = {
  [ChestType.EQUIPMENT]: {
    type: ChestType.EQUIPMENT,
    costPerPull: gachaData.equipment.costPerPull,
    pityThreshold: gachaData.equipment.pityThreshold,
    gradeWeights: gachaData.equipment.gradeWeights.map(w => ({
      grade: w.grade as EquipmentGrade,
      weight: w.weight,
    })),
  },
  [ChestType.PET]: {
    type: ChestType.PET,
    costPerPull: gachaData.pet.costPerPull,
    pityThreshold: gachaData.pet.pityThreshold,
    gradeWeights: [],
  },
  [ChestType.GEM]: {
    type: ChestType.GEM,
    costPerPull: gachaData.gem.costPerPull,
    pityThreshold: gachaData.gem.pityThreshold,
    gradeWeights: [],
  },
};

const SLOTS = [SlotType.WEAPON, SlotType.ARMOR, SlotType.RING, SlotType.NECKLACE, SlotType.SHOES, SlotType.GLOVES, SlotType.HAT];
const WEAPON_SUB_TYPES = [WeaponSubType.SWORD, WeaponSubType.STAFF, WeaponSubType.BOW];
const S_RATE = gachaData.equipment.sRate;
const S_ELIGIBLE_GRADES = new Set(gachaData.equipment.sEligibleGrades as EquipmentGrade[]);

export interface PullResult {
  equipment: Equipment | null;
  resources: { type: ResourceType; amount: number }[];
  isPity: boolean;
}

export class TreasureChest {
  type: ChestType;
  pityCount: number;
  private config: ChestConfig;

  constructor(type: ChestType) {
    this.type = type;
    this.pityCount = 0;
    this.config = CHEST_CONFIGS[type];
  }

  getCostPerPull(): number {
    return this.config.costPerPull;
  }

  getPull10Cost(): number {
    return this.config.costPerPull * 9;
  }

  getPityThreshold(): number {
    return this.config.pityThreshold;
  }

  pull(rng: SeededRandom): PullResult {
    if (this.type === ChestType.PET || this.type === ChestType.GEM) {
      return this.pullSpecial(rng);
    }

    this.pityCount += 1;

    if (this.config.pityThreshold > 0 && this.pityCount >= this.config.pityThreshold) {
      this.pityCount = 0;
      return this.createPityResult(rng);
    }

    const grade = rng.weightedPick(
      this.config.gradeWeights.map(w => ({ item: w.grade, weight: w.weight }))
    );

    const slot = rng.pick(SLOTS);
    const isS = S_ELIGIBLE_GRADES.has(grade) && rng.chance(S_RATE);
    const subType = slot === SlotType.WEAPON ? rng.pick(WEAPON_SUB_TYPES) : null;
    const name = slot === SlotType.WEAPON && subType
      ? `${EquipmentDataTable.getGradeLabel(grade)} ${EquipmentDataTable.getWeaponSubTypeLabel(subType)}`
      : `${EquipmentDataTable.getGradeLabel(grade)} ${EquipmentDataTable.getSlotLabel(slot)}`;

    const equipment = new Equipment(
      `chest_${Date.now()}_${rng.nextInt(0, 9999)}`,
      name,
      slot,
      grade,
      isS,
      0, 0, null,
      subType,
    );

    return { equipment, resources: [], isPity: false };
  }

  pull10(rng: SeededRandom): PullResult[] {
    const results: PullResult[] = [];
    for (let i = 0; i < 10; i++) {
      results.push(this.pull(rng));
    }
    return results;
  }

  private createPityResult(rng: SeededRandom): PullResult {
    const slot = rng.pick(SLOTS);
    const subType = slot === SlotType.WEAPON ? rng.pick(WEAPON_SUB_TYPES) : null;
    const slotLabel = slot === SlotType.WEAPON && subType
      ? EquipmentDataTable.getWeaponSubTypeLabel(subType)
      : EquipmentDataTable.getSlotLabel(slot);
    const equipment = new Equipment(
      `pity_${Date.now()}`,
      `신화 ${slotLabel}`,
      slot,
      EquipmentGrade.MYTHIC,
      false,
      0, 0, null,
      subType,
    );
    return { equipment, resources: [], isPity: true };
  }

  private pullSpecial(rng: SeededRandom): PullResult {
    if (this.type === ChestType.PET) {
      return {
        equipment: null,
        resources: [
          { type: ResourceType.PET_EGG, amount: gachaData.pet.eggAmount },
          { type: ResourceType.PET_FOOD, amount: rng.nextInt(gachaData.pet.foodMin, gachaData.pet.foodMax) },
        ],
        isPity: false,
      };
    }

    return {
      equipment: null,
      resources: [
        { type: ResourceType.GEMS, amount: rng.nextInt(gachaData.gem.gemsMin, gachaData.gem.gemsMax) },
      ],
      isPity: false,
    };
  }

  getPityProgress(): number {
    if (this.config.pityThreshold === 0) return 0;
    return this.pityCount / this.config.pityThreshold;
  }

  getRemainingToPity(): number {
    if (this.config.pityThreshold === 0) return -1;
    return this.config.pityThreshold - this.pityCount;
  }
}
