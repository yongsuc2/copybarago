import { EquipmentGrade, SlotType, WeaponSubType, EffectType, StatusEffectType } from '../enums';
import data from './json/equipment-passive.data.json';

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

const DESCRIPTION_BUILDERS: Record<string, (v: number) => string> = {
  BUFF_ATK_UP: v => `공격력 ${pct(v)} 증가`,
  BUFF_CRIT_UP: v => `치명타 확률 ${pct(v)} 증가`,
  BUFF_DEF_UP: v => `방어력 ${pct(v)} 증가`,
  MAGIC_BOOST: v => `마법 스킬 계수 +${pct(v)}`,
  RAGE_BOOST: v => `분노 추가 충전 +${v}`,
  SHIELD: v => `최대체력의 ${pct(v)} 방어막`,
  HOT_REGEN: v => `매턴 HP ${v} 회복`,
  MULTI_HIT: v => `${pct(v)} 확률로 추가 타격`,
};

function buildDescription(effectType: string, statusEffectType: string | undefined, value: number): string {
  const key = statusEffectType ? `${effectType}_${statusEffectType}` : effectType;
  const builder = DESCRIPTION_BUILDERS[key];
  return builder ? builder(value) : '';
}

const WEAPON_PASSIVES: WeaponPassiveEntry[] = data.weaponPassives.map(r => ({
  subType: r.subType as WeaponSubType,
  grade: r.grade as EquipmentGrade,
  passive: {
    effectType: r.effectType as EffectType,
    statusEffectType: r.statusEffectType as StatusEffectType | undefined,
    value: r.value,
    description: buildDescription(r.effectType, r.statusEffectType, r.value),
    icon: r.icon,
  },
}));

const SLOT_PASSIVES: SlotPassiveEntry[] = data.slotPassives.map(r => ({
  slot: r.slot as SlotType,
  grade: r.grade as EquipmentGrade,
  passive: {
    effectType: r.effectType as EffectType,
    statusEffectType: r.statusEffectType as StatusEffectType | undefined,
    value: r.value,
    description: buildDescription(r.effectType, r.statusEffectType, r.value),
    icon: r.icon,
  },
}));

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
