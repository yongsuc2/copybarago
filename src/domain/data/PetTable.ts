import { PetTier, PetGrade, PassiveType, StatType } from '../enums';
import { Stats } from '../value-objects/Stats';
import { SeededRandom } from '../../infrastructure/SeededRandom';

export interface PetAbilityDef {
  passiveType: PassiveType;
  stat?: StatType;
  baseValue: number;
  gradeScale: number;
  isPercentage: boolean;
}

export interface PetTemplateData {
  id: string;
  name: string;
  tier: PetTier;
  basePassiveBonus: Stats;
  weight: number;
  ability: PetAbilityDef;
}

const GRADE_MULTIPLIERS: Record<PetGrade, number> = {
  [PetGrade.COMMON]: 1,
  [PetGrade.RARE]: 1.5,
  [PetGrade.EPIC]: 2,
  [PetGrade.LEGENDARY]: 3,
  [PetGrade.IMMORTAL]: 5,
};

const PET_TEMPLATES: PetTemplateData[] = [
  { id: 'elsa', name: 'Elsa', tier: PetTier.S, basePassiveBonus: Stats.create({ atk: 8, maxHp: 40 }), weight: 2,
    ability: { passiveType: PassiveType.SHIELD_ON_START, baseValue: 0.05, gradeScale: 0.05, isPercentage: true } },
  { id: 'piggy', name: 'Piggy', tier: PetTier.S, basePassiveBonus: Stats.create({ atk: 5, maxHp: 30 }), weight: 2,
    ability: { passiveType: PassiveType.LIFESTEAL, baseValue: 0.05, gradeScale: 0.05, isPercentage: true } },
  { id: 'freya', name: 'Freya', tier: PetTier.S, basePassiveBonus: Stats.create({ atk: 12, maxHp: 20 }), weight: 2,
    ability: { passiveType: PassiveType.STAT_MODIFIER, stat: StatType.ATK, baseValue: 0.08, gradeScale: 0.08, isPercentage: true } },
  { id: 'slime_king', name: 'Slime King', tier: PetTier.S, basePassiveBonus: Stats.create({ def: 5, maxHp: 60 }), weight: 2,
    ability: { passiveType: PassiveType.STAT_MODIFIER, stat: StatType.DEF, baseValue: 0.10, gradeScale: 0.10, isPercentage: true } },
  { id: 'flash', name: 'Flash', tier: PetTier.S, basePassiveBonus: Stats.create({ atk: 10, crit: 0.03 }), weight: 2,
    ability: { passiveType: PassiveType.MULTI_HIT, baseValue: 0.05, gradeScale: 0.05, isPercentage: true } },
  { id: 'unicorn', name: 'Unicorn', tier: PetTier.S, basePassiveBonus: Stats.create({ maxHp: 80 }), weight: 2,
    ability: { passiveType: PassiveType.REGEN, baseValue: 15, gradeScale: 15, isPercentage: false } },
  { id: 'ice_wind_fox', name: 'Ice Wind Fox', tier: PetTier.S, basePassiveBonus: Stats.create({ atk: 7, maxHp: 35 }), weight: 3,
    ability: { passiveType: PassiveType.COUNTER, baseValue: 0.08, gradeScale: 0.08, isPercentage: true } },
  { id: 'little_elle', name: 'Little Elle', tier: PetTier.S, basePassiveBonus: Stats.create({ atk: 6, maxHp: 40 }), weight: 3,
    ability: { passiveType: PassiveType.REVIVE, baseValue: 0.15, gradeScale: 0.15, isPercentage: true } },
  { id: 'cleopatra', name: 'Cleopatra', tier: PetTier.S, basePassiveBonus: Stats.create({ atk: 9, maxHp: 30 }), weight: 2,
    ability: { passiveType: PassiveType.STAT_MODIFIER, stat: StatType.CRIT, baseValue: 0.03, gradeScale: 0.03, isPercentage: true } },

  { id: 'purple_demon_fox', name: 'Purple Demon Fox', tier: PetTier.A, basePassiveBonus: Stats.create({ atk: 6, maxHp: 25 }), weight: 8,
    ability: { passiveType: PassiveType.LIFESTEAL, baseValue: 0.03, gradeScale: 0.03, isPercentage: true } },
  { id: 'baby_dragon', name: 'Baby Dragon', tier: PetTier.A, basePassiveBonus: Stats.create({ atk: 7, maxHp: 20 }), weight: 8,
    ability: { passiveType: PassiveType.STAT_MODIFIER, stat: StatType.ATK, baseValue: 0.05, gradeScale: 0.05, isPercentage: true } },
  { id: 'monopoly', name: 'Monopoly', tier: PetTier.A, basePassiveBonus: Stats.create({ atk: 4, maxHp: 30 }), weight: 8,
    ability: { passiveType: PassiveType.SHIELD_ON_START, baseValue: 0.03, gradeScale: 0.03, isPercentage: true } },
  { id: 'glazed_shroom', name: 'Glazed Shroom', tier: PetTier.A, basePassiveBonus: Stats.create({ atk: 5, maxHp: 25 }), weight: 8,
    ability: { passiveType: PassiveType.REGEN, baseValue: 8, gradeScale: 8, isPercentage: false } },
  { id: 'flame_fox', name: 'Flame Fox', tier: PetTier.A, basePassiveBonus: Stats.create({ atk: 8, maxHp: 15 }), weight: 8,
    ability: { passiveType: PassiveType.MULTI_HIT, baseValue: 0.03, gradeScale: 0.03, isPercentage: true } },
  { id: 'cactus_fighter', name: 'Cactus Fighter', tier: PetTier.A, basePassiveBonus: Stats.create({ def: 3, maxHp: 35 }), weight: 8,
    ability: { passiveType: PassiveType.COUNTER, baseValue: 0.05, gradeScale: 0.05, isPercentage: true } },

  { id: 'brown_bunny', name: 'Brown Bunny', tier: PetTier.B, basePassiveBonus: Stats.create({ atk: 3, maxHp: 15 }), weight: 15,
    ability: { passiveType: PassiveType.STAT_MODIFIER, stat: StatType.ATK, baseValue: 0.03, gradeScale: 0.03, isPercentage: true } },
  { id: 'blue_bird', name: 'Blue Bird', tier: PetTier.B, basePassiveBonus: Stats.create({ atk: 2, maxHp: 20 }), weight: 15,
    ability: { passiveType: PassiveType.REGEN, baseValue: 5, gradeScale: 5, isPercentage: false } },
  { id: 'green_frog', name: 'Green Frog', tier: PetTier.B, basePassiveBonus: Stats.create({ def: 2, maxHp: 18 }), weight: 15,
    ability: { passiveType: PassiveType.STAT_MODIFIER, stat: StatType.DEF, baseValue: 0.05, gradeScale: 0.05, isPercentage: true } },
];

const ABILITY_LABELS: Partial<Record<PassiveType, string>> = {
  [PassiveType.STAT_MODIFIER]: '스탯 강화',
  [PassiveType.COUNTER]: '반격',
  [PassiveType.LIFESTEAL]: '흡혈',
  [PassiveType.SHIELD_ON_START]: '방어막',
  [PassiveType.REVIVE]: '부활',
  [PassiveType.REGEN]: '재생',
  [PassiveType.MULTI_HIT]: '연타',
};

const STAT_LABELS: Partial<Record<StatType, string>> = {
  [StatType.ATK]: '공격력',
  [StatType.DEF]: '방어력',
  [StatType.CRIT]: '치명타',
  [StatType.HP]: '체력',
};

function pct(v: number): string {
  return `${Math.round(v * 100)}%`;
}

export const PetTable = {
  getTemplate(id: string): PetTemplateData | undefined {
    return PET_TEMPLATES.find(p => p.id === id);
  },

  getAllTemplates(): PetTemplateData[] {
    return PET_TEMPLATES;
  },

  getRandomTemplate(rng: SeededRandom): PetTemplateData {
    return rng.weightedPick(
      PET_TEMPLATES.map(t => ({ item: t, weight: t.weight }))
    );
  },

  getTemplatesByTier(tier: PetTier): PetTemplateData[] {
    return PET_TEMPLATES.filter(p => p.tier === tier);
  },

  getAbilityValue(ability: PetAbilityDef, grade: PetGrade): number {
    const mult = GRADE_MULTIPLIERS[grade];
    return ability.baseValue + ability.gradeScale * (mult - 1);
  },

  getAbilityDescription(petId: string, grade: PetGrade): string {
    const template = PET_TEMPLATES.find(p => p.id === petId);
    if (!template) return '';
    const ab = template.ability;
    const val = this.getAbilityValue(ab, grade);

    const label = ABILITY_LABELS[ab.passiveType] ?? ab.passiveType;

    switch (ab.passiveType) {
      case PassiveType.STAT_MODIFIER:
        return `${STAT_LABELS[ab.stat!] ?? ab.stat} +${pct(val)}`;
      case PassiveType.COUNTER:
        return `${label} 확률 ${pct(val)}`;
      case PassiveType.LIFESTEAL:
        return `${label} ${pct(val)}`;
      case PassiveType.SHIELD_ON_START:
        return `${label} (최대체력 ${pct(val)})`;
      case PassiveType.REVIVE:
        return `${label} (체력 ${pct(val)} 회복)`;
      case PassiveType.REGEN:
        return `매턴 HP +${Math.round(val)}`;
      case PassiveType.MULTI_HIT:
        return `${label} 확률 ${pct(val)}`;
      default:
        return label;
    }
  },

  gradeMultipliers: GRADE_MULTIPLIERS,
};
