import {
  SkillGrade,
  SkillTag,
  HeritageRoute,
  PassiveType,
  StatType,
} from '../enums';

export interface StatModifierEffect {
  type: PassiveType.STAT_MODIFIER;
  stat: StatType | 'RAGE_POWER';
  value: number;
  isPercentage: boolean;
}

export interface CounterEffect {
  type: PassiveType.COUNTER;
  damageRate: number;
  triggerChance: number;
}

export interface LifestealEffect {
  type: PassiveType.LIFESTEAL;
  rate: number;
}

export interface ShieldOnStartEffect {
  type: PassiveType.SHIELD_ON_START;
  hpPercent: number;
}

export interface ReviveEffect {
  type: PassiveType.REVIVE;
  hpPercent: number;
  maxUses: number;
}

export interface RegenEffect {
  type: PassiveType.REGEN;
  healPerTurn: number;
}

export interface MultiHitEffect {
  type: PassiveType.MULTI_HIT;
  chance: number;
}

export interface SkillModifierEffect {
  type: PassiveType.SKILL_MODIFIER;
  targetTag: SkillTag;
  modifier: {
    critBonus?: number;
    damageMultiplier?: number;
  };
}

export type PassiveEffect =
  | StatModifierEffect
  | CounterEffect
  | LifestealEffect
  | ShieldOnStartEffect
  | ReviveEffect
  | RegenEffect
  | MultiHitEffect
  | SkillModifierEffect;

const TIER_TO_GRADE: Record<number, SkillGrade> = {
  1: SkillGrade.NORMAL,
  2: SkillGrade.LEGENDARY,
  3: SkillGrade.MYTHIC,
  4: SkillGrade.IMMORTAL,
};

export class PassiveSkill {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly icon: string,
    public readonly tier: number,
    public readonly tags: SkillTag[],
    public readonly heritageSynergy: HeritageRoute[],
    public readonly effect: PassiveEffect,
    public readonly description: string = '',
  ) {}

  get grade(): SkillGrade {
    return TIER_TO_GRADE[this.tier] ?? SkillGrade.NORMAL;
  }

  isMaxTier(): boolean {
    return this.tier >= 4;
  }

  isSynergyWith(route: HeritageRoute): boolean {
    return this.heritageSynergy.includes(route);
  }
}
