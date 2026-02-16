import { ChestType, EquipmentGrade, ResourceType, SlotType, WeaponSubType } from '../enums';
import { Equipment } from '../entities/Equipment';
import { SeededRandom } from '../../infrastructure/SeededRandom';
import { EquipmentDataTable } from '../data/EquipmentDataTable';

interface ChestConfig {
  type: ChestType;
  costPerPull: number;
  pityThreshold: number;
  gradeWeights: { grade: EquipmentGrade; weight: number }[];
}

const CHEST_CONFIGS: Record<ChestType, ChestConfig> = {
  [ChestType.BRONZE]: {
    type: ChestType.BRONZE,
    costPerPull: 100,
    pityThreshold: 0,
    gradeWeights: [
      { grade: EquipmentGrade.COMMON, weight: 60 },
      { grade: EquipmentGrade.UNCOMMON, weight: 30 },
      { grade: EquipmentGrade.RARE, weight: 10 },
    ],
  },
  [ChestType.SILVER]: {
    type: ChestType.SILVER,
    costPerPull: 200,
    pityThreshold: 0,
    gradeWeights: [
      { grade: EquipmentGrade.COMMON, weight: 30 },
      { grade: EquipmentGrade.UNCOMMON, weight: 40 },
      { grade: EquipmentGrade.RARE, weight: 25 },
      { grade: EquipmentGrade.EPIC, weight: 5 },
    ],
  },
  [ChestType.GOLD]: {
    type: ChestType.GOLD,
    costPerPull: 298,
    pityThreshold: 180,
    gradeWeights: [
      { grade: EquipmentGrade.UNCOMMON, weight: 25 },
      { grade: EquipmentGrade.RARE, weight: 40 },
      { grade: EquipmentGrade.EPIC, weight: 28 },
      { grade: EquipmentGrade.LEGENDARY, weight: 6 },
      { grade: EquipmentGrade.MYTHIC, weight: 1 },
    ],
  },
  [ChestType.PET]: {
    type: ChestType.PET,
    costPerPull: 298,
    pityThreshold: 0,
    gradeWeights: [],
  },
  [ChestType.GEM]: {
    type: ChestType.GEM,
    costPerPull: 0,
    pityThreshold: 0,
    gradeWeights: [],
  },
};

const SLOTS = [SlotType.WEAPON, SlotType.ARMOR, SlotType.RING, SlotType.NECKLACE, SlotType.SHOES, SlotType.GLOVES, SlotType.HAT];
const WEAPON_SUB_TYPES = [WeaponSubType.SWORD, WeaponSubType.STAFF, WeaponSubType.BOW];
const S_RATE = 0.02;

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
    const isS = grade === EquipmentGrade.EPIC && rng.chance(S_RATE);
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
      `S-에픽 ${slotLabel}`,
      slot,
      EquipmentGrade.EPIC,
      true,
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
          { type: ResourceType.PET_EGG, amount: 1 },
          { type: ResourceType.PET_FOOD, amount: rng.nextInt(1, 5) },
        ],
        isPity: false,
      };
    }

    return {
      equipment: null,
      resources: [
        { type: ResourceType.GEMS, amount: rng.nextInt(20, 100) },
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
