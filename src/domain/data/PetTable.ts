import { PetTier, PetGrade, PassiveType, StatType } from '../enums';
import { Stats } from '../value-objects/Stats';
import type { SeededRandom } from '../../infrastructure/SeededRandom';
import data from './json/pet.data.json';

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

const GRADE_MULTIPLIERS = data.gradeMultipliers as Record<PetGrade, number>;
const ABILITY_LABELS = data.abilityLabels as Partial<Record<PassiveType, string>>;
const STAT_LABELS = data.statLabels as Partial<Record<StatType, string>>;

const PET_TEMPLATES: PetTemplateData[] = data.templates.map(t => ({
  id: t.id,
  name: t.name,
  tier: t.tier as PetTier,
  basePassiveBonus: Stats.create({ atk: t.atk, maxHp: t.maxHp, def: t.def, crit: t.crit }),
  weight: t.weight,
  ability: {
    passiveType: t.ability.passiveType as PassiveType,
    stat: t.ability.stat as StatType | undefined,
    baseValue: t.ability.baseValue,
    gradeScale: t.ability.gradeScale,
    isPercentage: t.ability.isPercentage,
  },
}));

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
