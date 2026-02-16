import { EquipmentGrade, SlotType, WeaponSubType, EffectType, StatusEffectType } from '../enums';

export interface EquipmentPassiveDef {
  effectType: EffectType;
  statusEffectType?: StatusEffectType;
  value: number;
  description: string;
  icon: string;
}

interface WeaponPassiveEntry {
  subType: WeaponSubType;
  grade: EquipmentGrade;
  passive: EquipmentPassiveDef;
}

interface SlotPassiveEntry {
  slot: SlotType;
  grade: EquipmentGrade;
  passive: EquipmentPassiveDef;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

const WEAPON_PASSIVES: WeaponPassiveEntry[] = [
  { subType: WeaponSubType.SWORD, grade: EquipmentGrade.COMMON, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.ATK_UP, value: 0.03, description: `공격력 ${pct(0.03)} 증가`, icon: '⚔️' } },
  { subType: WeaponSubType.SWORD, grade: EquipmentGrade.UNCOMMON, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.ATK_UP, value: 0.06, description: `공격력 ${pct(0.06)} 증가`, icon: '⚔️' } },
  { subType: WeaponSubType.SWORD, grade: EquipmentGrade.RARE, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.ATK_UP, value: 0.10, description: `공격력 ${pct(0.10)} 증가`, icon: '⚔️' } },
  { subType: WeaponSubType.SWORD, grade: EquipmentGrade.EPIC, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.ATK_UP, value: 0.15, description: `공격력 ${pct(0.15)} 증가`, icon: '⚔️' } },
  { subType: WeaponSubType.SWORD, grade: EquipmentGrade.LEGENDARY, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.ATK_UP, value: 0.20, description: `공격력 ${pct(0.20)} 증가`, icon: '⚔️' } },
  { subType: WeaponSubType.SWORD, grade: EquipmentGrade.MYTHIC, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.ATK_UP, value: 0.25, description: `공격력 ${pct(0.25)} 증가`, icon: '⚔️' } },

  { subType: WeaponSubType.STAFF, grade: EquipmentGrade.COMMON, passive: { effectType: EffectType.MAGIC_BOOST, value: 0.05, description: `마법 스킬 계수 +${pct(0.05)}`, icon: '🪄' } },
  { subType: WeaponSubType.STAFF, grade: EquipmentGrade.UNCOMMON, passive: { effectType: EffectType.MAGIC_BOOST, value: 0.10, description: `마법 스킬 계수 +${pct(0.10)}`, icon: '🪄' } },
  { subType: WeaponSubType.STAFF, grade: EquipmentGrade.RARE, passive: { effectType: EffectType.MAGIC_BOOST, value: 0.15, description: `마법 스킬 계수 +${pct(0.15)}`, icon: '🪄' } },
  { subType: WeaponSubType.STAFF, grade: EquipmentGrade.EPIC, passive: { effectType: EffectType.MAGIC_BOOST, value: 0.20, description: `마법 스킬 계수 +${pct(0.20)}`, icon: '🪄' } },
  { subType: WeaponSubType.STAFF, grade: EquipmentGrade.LEGENDARY, passive: { effectType: EffectType.MAGIC_BOOST, value: 0.28, description: `마법 스킬 계수 +${pct(0.28)}`, icon: '🪄' } },
  { subType: WeaponSubType.STAFF, grade: EquipmentGrade.MYTHIC, passive: { effectType: EffectType.MAGIC_BOOST, value: 0.35, description: `마법 스킬 계수 +${pct(0.35)}`, icon: '🪄' } },

  { subType: WeaponSubType.BOW, grade: EquipmentGrade.COMMON, passive: { effectType: EffectType.RAGE_BOOST, value: 3, description: `분노 추가 충전 +3`, icon: '🏹' } },
  { subType: WeaponSubType.BOW, grade: EquipmentGrade.UNCOMMON, passive: { effectType: EffectType.RAGE_BOOST, value: 5, description: `분노 추가 충전 +5`, icon: '🏹' } },
  { subType: WeaponSubType.BOW, grade: EquipmentGrade.RARE, passive: { effectType: EffectType.RAGE_BOOST, value: 10, description: `분노 추가 충전 +10`, icon: '🏹' } },
  { subType: WeaponSubType.BOW, grade: EquipmentGrade.EPIC, passive: { effectType: EffectType.RAGE_BOOST, value: 15, description: `분노 추가 충전 +15`, icon: '🏹' } },
  { subType: WeaponSubType.BOW, grade: EquipmentGrade.LEGENDARY, passive: { effectType: EffectType.RAGE_BOOST, value: 20, description: `분노 추가 충전 +20`, icon: '🏹' } },
  { subType: WeaponSubType.BOW, grade: EquipmentGrade.MYTHIC, passive: { effectType: EffectType.RAGE_BOOST, value: 25, description: `분노 추가 충전 +25`, icon: '🏹' } },
];

const SLOT_PASSIVES: SlotPassiveEntry[] = [
  { slot: SlotType.ARMOR, grade: EquipmentGrade.COMMON, passive: { effectType: EffectType.SHIELD, value: 0.03, description: `최대체력의 ${pct(0.03)} 방어막`, icon: '🛡️' } },
  { slot: SlotType.ARMOR, grade: EquipmentGrade.UNCOMMON, passive: { effectType: EffectType.SHIELD, value: 0.06, description: `최대체력의 ${pct(0.06)} 방어막`, icon: '🛡️' } },
  { slot: SlotType.ARMOR, grade: EquipmentGrade.RARE, passive: { effectType: EffectType.SHIELD, value: 0.10, description: `최대체력의 ${pct(0.10)} 방어막`, icon: '🛡️' } },
  { slot: SlotType.ARMOR, grade: EquipmentGrade.EPIC, passive: { effectType: EffectType.SHIELD, value: 0.15, description: `최대체력의 ${pct(0.15)} 방어막`, icon: '🛡️' } },
  { slot: SlotType.ARMOR, grade: EquipmentGrade.LEGENDARY, passive: { effectType: EffectType.SHIELD, value: 0.20, description: `최대체력의 ${pct(0.20)} 방어막`, icon: '🛡️' } },
  { slot: SlotType.ARMOR, grade: EquipmentGrade.MYTHIC, passive: { effectType: EffectType.SHIELD, value: 0.25, description: `최대체력의 ${pct(0.25)} 방어막`, icon: '🛡️' } },

  { slot: SlotType.RING, grade: EquipmentGrade.COMMON, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.CRIT_UP, value: 0.02, description: `치명타 확률 ${pct(0.02)} 증가`, icon: '💍' } },
  { slot: SlotType.RING, grade: EquipmentGrade.UNCOMMON, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.CRIT_UP, value: 0.04, description: `치명타 확률 ${pct(0.04)} 증가`, icon: '💍' } },
  { slot: SlotType.RING, grade: EquipmentGrade.RARE, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.CRIT_UP, value: 0.08, description: `치명타 확률 ${pct(0.08)} 증가`, icon: '💍' } },
  { slot: SlotType.RING, grade: EquipmentGrade.EPIC, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.CRIT_UP, value: 0.12, description: `치명타 확률 ${pct(0.12)} 증가`, icon: '💍' } },
  { slot: SlotType.RING, grade: EquipmentGrade.LEGENDARY, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.CRIT_UP, value: 0.15, description: `치명타 확률 ${pct(0.15)} 증가`, icon: '💍' } },
  { slot: SlotType.RING, grade: EquipmentGrade.MYTHIC, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.CRIT_UP, value: 0.18, description: `치명타 확률 ${pct(0.18)} 증가`, icon: '💍' } },

  { slot: SlotType.NECKLACE, grade: EquipmentGrade.COMMON, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.ATK_UP, value: 0.02, description: `공격력 ${pct(0.02)} 증가`, icon: '📿' } },
  { slot: SlotType.NECKLACE, grade: EquipmentGrade.UNCOMMON, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.ATK_UP, value: 0.04, description: `공격력 ${pct(0.04)} 증가`, icon: '📿' } },
  { slot: SlotType.NECKLACE, grade: EquipmentGrade.RARE, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.ATK_UP, value: 0.08, description: `공격력 ${pct(0.08)} 증가`, icon: '📿' } },
  { slot: SlotType.NECKLACE, grade: EquipmentGrade.EPIC, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.ATK_UP, value: 0.12, description: `공격력 ${pct(0.12)} 증가`, icon: '📿' } },
  { slot: SlotType.NECKLACE, grade: EquipmentGrade.LEGENDARY, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.ATK_UP, value: 0.15, description: `공격력 ${pct(0.15)} 증가`, icon: '📿' } },
  { slot: SlotType.NECKLACE, grade: EquipmentGrade.MYTHIC, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.ATK_UP, value: 0.18, description: `공격력 ${pct(0.18)} 증가`, icon: '📿' } },

  { slot: SlotType.SHOES, grade: EquipmentGrade.COMMON, passive: { effectType: EffectType.HOT, statusEffectType: StatusEffectType.REGEN, value: 3, description: `매턴 HP 3 회복`, icon: '👟' } },
  { slot: SlotType.SHOES, grade: EquipmentGrade.UNCOMMON, passive: { effectType: EffectType.HOT, statusEffectType: StatusEffectType.REGEN, value: 8, description: `매턴 HP 8 회복`, icon: '👟' } },
  { slot: SlotType.SHOES, grade: EquipmentGrade.RARE, passive: { effectType: EffectType.HOT, statusEffectType: StatusEffectType.REGEN, value: 18, description: `매턴 HP 18 회복`, icon: '👟' } },
  { slot: SlotType.SHOES, grade: EquipmentGrade.EPIC, passive: { effectType: EffectType.HOT, statusEffectType: StatusEffectType.REGEN, value: 30, description: `매턴 HP 30 회복`, icon: '👟' } },
  { slot: SlotType.SHOES, grade: EquipmentGrade.LEGENDARY, passive: { effectType: EffectType.HOT, statusEffectType: StatusEffectType.REGEN, value: 45, description: `매턴 HP 45 회복`, icon: '👟' } },
  { slot: SlotType.SHOES, grade: EquipmentGrade.MYTHIC, passive: { effectType: EffectType.HOT, statusEffectType: StatusEffectType.REGEN, value: 60, description: `매턴 HP 60 회복`, icon: '👟' } },

  { slot: SlotType.GLOVES, grade: EquipmentGrade.COMMON, passive: { effectType: EffectType.MULTI_HIT, value: 0.03, description: `${pct(0.03)} 확률로 추가 타격`, icon: '🧤' } },
  { slot: SlotType.GLOVES, grade: EquipmentGrade.UNCOMMON, passive: { effectType: EffectType.MULTI_HIT, value: 0.06, description: `${pct(0.06)} 확률로 추가 타격`, icon: '🧤' } },
  { slot: SlotType.GLOVES, grade: EquipmentGrade.RARE, passive: { effectType: EffectType.MULTI_HIT, value: 0.10, description: `${pct(0.10)} 확률로 추가 타격`, icon: '🧤' } },
  { slot: SlotType.GLOVES, grade: EquipmentGrade.EPIC, passive: { effectType: EffectType.MULTI_HIT, value: 0.15, description: `${pct(0.15)} 확률로 추가 타격`, icon: '🧤' } },
  { slot: SlotType.GLOVES, grade: EquipmentGrade.LEGENDARY, passive: { effectType: EffectType.MULTI_HIT, value: 0.20, description: `${pct(0.20)} 확률로 추가 타격`, icon: '🧤' } },
  { slot: SlotType.GLOVES, grade: EquipmentGrade.MYTHIC, passive: { effectType: EffectType.MULTI_HIT, value: 0.25, description: `${pct(0.25)} 확률로 추가 타격`, icon: '🧤' } },

  { slot: SlotType.HAT, grade: EquipmentGrade.COMMON, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.DEF_UP, value: 0.03, description: `방어력 ${pct(0.03)} 증가`, icon: '🎩' } },
  { slot: SlotType.HAT, grade: EquipmentGrade.UNCOMMON, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.DEF_UP, value: 0.06, description: `방어력 ${pct(0.06)} 증가`, icon: '🎩' } },
  { slot: SlotType.HAT, grade: EquipmentGrade.RARE, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.DEF_UP, value: 0.10, description: `방어력 ${pct(0.10)} 증가`, icon: '🎩' } },
  { slot: SlotType.HAT, grade: EquipmentGrade.EPIC, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.DEF_UP, value: 0.15, description: `방어력 ${pct(0.15)} 증가`, icon: '🎩' } },
  { slot: SlotType.HAT, grade: EquipmentGrade.LEGENDARY, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.DEF_UP, value: 0.20, description: `방어력 ${pct(0.20)} 증가`, icon: '🎩' } },
  { slot: SlotType.HAT, grade: EquipmentGrade.MYTHIC, passive: { effectType: EffectType.BUFF, statusEffectType: StatusEffectType.DEF_UP, value: 0.25, description: `방어력 ${pct(0.25)} 증가`, icon: '🎩' } },
];

export const EquipmentPassiveTable = {
  getWeaponPassive(subType: WeaponSubType, grade: EquipmentGrade): EquipmentPassiveDef | null {
    return WEAPON_PASSIVES.find(e => e.subType === subType && e.grade === grade)?.passive ?? null;
  },

  getSlotPassive(slot: SlotType, grade: EquipmentGrade): EquipmentPassiveDef | null {
    return SLOT_PASSIVES.find(e => e.slot === slot && e.grade === grade)?.passive ?? null;
  },

  getPassive(slot: SlotType, grade: EquipmentGrade, weaponSubType: WeaponSubType | null): EquipmentPassiveDef | null {
    if (slot === SlotType.WEAPON && weaponSubType) {
      return this.getWeaponPassive(weaponSubType, grade);
    }
    return this.getSlotPassive(slot, grade);
  },
};
