import { EquipmentGrade, SlotType } from '../enums';

const GRADE_LABELS: Record<EquipmentGrade, string> = {
  [EquipmentGrade.COMMON]: '일반',
  [EquipmentGrade.UNCOMMON]: '우수',
  [EquipmentGrade.RARE]: '희귀',
  [EquipmentGrade.EPIC]: '에픽',
  [EquipmentGrade.LEGENDARY]: '전설',
  [EquipmentGrade.MYTHIC]: '신화',
};

const SLOT_LABELS: Record<SlotType, string> = {
  [SlotType.WEAPON]: '무기',
  [SlotType.ARMOR]: '방어구',
  [SlotType.RING]: '반지',
  [SlotType.NECKLACE]: '목걸이',
  [SlotType.SHOES]: '신발',
  [SlotType.GLOVES]: '장갑',
  [SlotType.HAT]: '모자',
};

const SELL_PRICES: Record<EquipmentGrade, number> = {
  [EquipmentGrade.COMMON]: 10,
  [EquipmentGrade.UNCOMMON]: 30,
  [EquipmentGrade.RARE]: 100,
  [EquipmentGrade.EPIC]: 300,
  [EquipmentGrade.LEGENDARY]: 1000,
  [EquipmentGrade.MYTHIC]: 3000,
};

export const EquipmentDataTable = {
  getGradeLabel(grade: EquipmentGrade): string {
    return GRADE_LABELS[grade];
  },
  getSlotLabel(slot: SlotType): string {
    return SLOT_LABELS[slot];
  },
  getSellPrice(grade: EquipmentGrade): number {
    return SELL_PRICES[grade];
  },
  gradeLabels: GRADE_LABELS,
  slotLabels: SLOT_LABELS,
  sellPrices: SELL_PRICES,
};
