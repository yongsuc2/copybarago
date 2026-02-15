import { EquipmentGrade, SlotType } from '../enums';
import { Stats } from '../value-objects/Stats';

interface EquipmentBaseStats {
  slot: SlotType;
  grade: EquipmentGrade;
  stats: Stats;
}

const BASE_STATS: EquipmentBaseStats[] = [
  { slot: SlotType.WEAPON, grade: EquipmentGrade.COMMON, stats: Stats.create({ atk: 10 }) },
  { slot: SlotType.WEAPON, grade: EquipmentGrade.UNCOMMON, stats: Stats.create({ atk: 25 }) },
  { slot: SlotType.WEAPON, grade: EquipmentGrade.RARE, stats: Stats.create({ atk: 50 }) },
  { slot: SlotType.WEAPON, grade: EquipmentGrade.EPIC, stats: Stats.create({ atk: 100 }) },
  { slot: SlotType.WEAPON, grade: EquipmentGrade.LEGENDARY, stats: Stats.create({ atk: 200 }) },
  { slot: SlotType.WEAPON, grade: EquipmentGrade.MYTHIC, stats: Stats.create({ atk: 400 }) },

  { slot: SlotType.ARMOR, grade: EquipmentGrade.COMMON, stats: Stats.create({ maxHp: 50 }) },
  { slot: SlotType.ARMOR, grade: EquipmentGrade.UNCOMMON, stats: Stats.create({ maxHp: 120 }) },
  { slot: SlotType.ARMOR, grade: EquipmentGrade.RARE, stats: Stats.create({ maxHp: 250 }) },
  { slot: SlotType.ARMOR, grade: EquipmentGrade.EPIC, stats: Stats.create({ maxHp: 500 }) },
  { slot: SlotType.ARMOR, grade: EquipmentGrade.LEGENDARY, stats: Stats.create({ maxHp: 1000 }) },
  { slot: SlotType.ARMOR, grade: EquipmentGrade.MYTHIC, stats: Stats.create({ maxHp: 2000 }) },

  { slot: SlotType.RING, grade: EquipmentGrade.COMMON, stats: Stats.create({ atk: 5 }) },
  { slot: SlotType.RING, grade: EquipmentGrade.UNCOMMON, stats: Stats.create({ atk: 12 }) },
  { slot: SlotType.RING, grade: EquipmentGrade.RARE, stats: Stats.create({ atk: 25 }) },
  { slot: SlotType.RING, grade: EquipmentGrade.EPIC, stats: Stats.create({ atk: 50 }) },
  { slot: SlotType.RING, grade: EquipmentGrade.LEGENDARY, stats: Stats.create({ atk: 100 }) },
  { slot: SlotType.RING, grade: EquipmentGrade.MYTHIC, stats: Stats.create({ atk: 200 }) },

  { slot: SlotType.NECKLACE, grade: EquipmentGrade.COMMON, stats: Stats.create({ atk: 3, maxHp: 30 }) },
  { slot: SlotType.NECKLACE, grade: EquipmentGrade.UNCOMMON, stats: Stats.create({ atk: 8, maxHp: 70 }) },
  { slot: SlotType.NECKLACE, grade: EquipmentGrade.RARE, stats: Stats.create({ atk: 15, maxHp: 150 }) },
  { slot: SlotType.NECKLACE, grade: EquipmentGrade.EPIC, stats: Stats.create({ atk: 30, maxHp: 300 }) },
  { slot: SlotType.NECKLACE, grade: EquipmentGrade.LEGENDARY, stats: Stats.create({ atk: 60, maxHp: 600 }) },
  { slot: SlotType.NECKLACE, grade: EquipmentGrade.MYTHIC, stats: Stats.create({ atk: 120, maxHp: 1200 }) },

  { slot: SlotType.SHOES, grade: EquipmentGrade.COMMON, stats: Stats.create({ maxHp: 40 }) },
  { slot: SlotType.SHOES, grade: EquipmentGrade.UNCOMMON, stats: Stats.create({ maxHp: 90 }) },
  { slot: SlotType.SHOES, grade: EquipmentGrade.RARE, stats: Stats.create({ maxHp: 190 }) },
  { slot: SlotType.SHOES, grade: EquipmentGrade.EPIC, stats: Stats.create({ maxHp: 380 }) },
  { slot: SlotType.SHOES, grade: EquipmentGrade.LEGENDARY, stats: Stats.create({ maxHp: 760 }) },
  { slot: SlotType.SHOES, grade: EquipmentGrade.MYTHIC, stats: Stats.create({ maxHp: 1520 }) },

  { slot: SlotType.GLOVES, grade: EquipmentGrade.COMMON, stats: Stats.create({ atk: 7 }) },
  { slot: SlotType.GLOVES, grade: EquipmentGrade.UNCOMMON, stats: Stats.create({ atk: 18 }) },
  { slot: SlotType.GLOVES, grade: EquipmentGrade.RARE, stats: Stats.create({ atk: 35 }) },
  { slot: SlotType.GLOVES, grade: EquipmentGrade.EPIC, stats: Stats.create({ atk: 70 }) },
  { slot: SlotType.GLOVES, grade: EquipmentGrade.LEGENDARY, stats: Stats.create({ atk: 140 }) },
  { slot: SlotType.GLOVES, grade: EquipmentGrade.MYTHIC, stats: Stats.create({ atk: 280 }) },

  { slot: SlotType.HAT, grade: EquipmentGrade.COMMON, stats: Stats.create({ maxHp: 35 }) },
  { slot: SlotType.HAT, grade: EquipmentGrade.UNCOMMON, stats: Stats.create({ maxHp: 80 }) },
  { slot: SlotType.HAT, grade: EquipmentGrade.RARE, stats: Stats.create({ maxHp: 170 }) },
  { slot: SlotType.HAT, grade: EquipmentGrade.EPIC, stats: Stats.create({ maxHp: 340 }) },
  { slot: SlotType.HAT, grade: EquipmentGrade.LEGENDARY, stats: Stats.create({ maxHp: 680 }) },
  { slot: SlotType.HAT, grade: EquipmentGrade.MYTHIC, stats: Stats.create({ maxHp: 1360 }) },
];

const UPGRADE_MULTIPLIER_PER_LEVEL = 0.05;

const MERGE_COUNT: Record<EquipmentGrade, number> = {
  [EquipmentGrade.COMMON]: 3,
  [EquipmentGrade.UNCOMMON]: 3,
  [EquipmentGrade.RARE]: 3,
  [EquipmentGrade.EPIC]: 2,
  [EquipmentGrade.LEGENDARY]: 2,
  [EquipmentGrade.MYTHIC]: 0,
};

const GRADE_ORDER: EquipmentGrade[] = [
  EquipmentGrade.COMMON,
  EquipmentGrade.UNCOMMON,
  EquipmentGrade.RARE,
  EquipmentGrade.EPIC,
  EquipmentGrade.LEGENDARY,
  EquipmentGrade.MYTHIC,
];

const PROMOTE_LEVELS = [10, 20, 30];

export const EquipmentTable = {
  getBaseStats(slot: SlotType, grade: EquipmentGrade): Stats {
    const entry = BASE_STATS.find(e => e.slot === slot && e.grade === grade);
    return entry?.stats ?? Stats.ZERO;
  },

  getUpgradeMultiplier(level: number): number {
    return 1 + level * UPGRADE_MULTIPLIER_PER_LEVEL;
  },

  getMergeCount(grade: EquipmentGrade): number {
    return MERGE_COUNT[grade];
  },

  getNextGrade(grade: EquipmentGrade): EquipmentGrade | null {
    const idx = GRADE_ORDER.indexOf(grade);
    if (idx >= GRADE_ORDER.length - 1) return null;
    return GRADE_ORDER[idx + 1];
  },

  getGradeIndex(grade: EquipmentGrade): number {
    return GRADE_ORDER.indexOf(grade);
  },

  getPromoteLevels(): number[] {
    return PROMOTE_LEVELS;
  },

  canPromoteAtLevel(level: number): boolean {
    return PROMOTE_LEVELS.includes(level);
  },

  getSlotMaxCount(slot: SlotType): number {
    if (slot === SlotType.RING) return 2;
    return 1;
  },
};
