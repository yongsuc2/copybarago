import { EquipmentGrade, SlotType, WeaponSubType } from '../enums';
import data from './json/equipment-labels.data.json';

const GRADE_LABELS = data.gradeLabels as Record<EquipmentGrade, string>;
const SLOT_LABELS = data.slotLabels as Record<SlotType, string>;
const WEAPON_SUB_TYPE_LABELS = data.weaponSubTypeLabels as Record<WeaponSubType, string>;
const SELL_PRICES = data.sellPrices as Record<EquipmentGrade, number>;

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
  getWeaponSubTypeLabel(subType: WeaponSubType): string {
    return WEAPON_SUB_TYPE_LABELS[subType];
  },
  gradeLabels: GRADE_LABELS,
  slotLabels: SLOT_LABELS,
  weaponSubTypeLabels: WEAPON_SUB_TYPE_LABELS,
  sellPrices: SELL_PRICES,
};
