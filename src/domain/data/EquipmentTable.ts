import { EquipmentGrade, SlotType } from '../enums';
import { Stats } from '../value-objects/Stats';
import baseStatsData from './json/equipment-base-stats.data.json';
import constantsData from './json/equipment-constants.data.json';

interface EquipmentBaseStats {
  slot: SlotType;
  grade: EquipmentGrade;
  stats: Stats;
}

const BASE_STATS: EquipmentBaseStats[] = baseStatsData.map(row => ({
  slot: row.slot as SlotType,
  grade: row.grade as EquipmentGrade,
  stats: Stats.create({ atk: row.atk, maxHp: row.maxHp, def: row.def, crit: row.crit }),
}));

const MERGE_COUNT = constantsData.mergeCount as Record<EquipmentGrade, number>;
const GRADE_ORDER = constantsData.gradeOrder as EquipmentGrade[];
const PROMOTE_LEVELS = constantsData.promoteLevels;
const SLOT_MAX_COUNT = constantsData.slotMaxCount as Record<string, number>;
const HIGH_GRADE_MERGE_SET = new Set(constantsData.highGradeMergeGrades as EquipmentGrade[]);

export const EquipmentTable = {
  getBaseStats(slot: SlotType, grade: EquipmentGrade): Stats {
    const entry = BASE_STATS.find(e => e.slot === slot && e.grade === grade);
    return entry?.stats ?? Stats.ZERO;
  },

  getUpgradeFlatPerLevel(): number {
    return constantsData.upgradeFlatPerLevel;
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
    return SLOT_MAX_COUNT[slot] ?? 1;
  },

  isHighGradeMerge(grade: EquipmentGrade): boolean {
    return HIGH_GRADE_MERGE_SET.has(grade);
  },

  getMergeEnhanceMax(): number {
    return constantsData.mergeEnhanceMax;
  },

  getUpgradeCost(currentLevel: number): number {
    const tiers = constantsData.upgradeCostTiers;
    let cost = constantsData.upgradeCostBase;
    for (let lv = 1; lv <= currentLevel; lv++) {
      const tier = tiers.find(t => lv <= t.upToLevel) ?? tiers[tiers.length - 1];
      cost = Math.ceil(cost * tier.rate);
    }
    return cost;
  },

  getTotalUpgradeCost(level: number): number {
    let total = 0;
    const tiers = constantsData.upgradeCostTiers;
    let cost = constantsData.upgradeCostBase;
    total += cost;
    for (let lv = 1; lv < level; lv++) {
      const tier = tiers.find(t => lv <= t.upToLevel) ?? tiers[tiers.length - 1];
      cost = Math.ceil(cost * tier.rate);
      total += cost;
    }
    return level > 0 ? total : 0;
  },
};
