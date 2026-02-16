import {
  SkillGrade,
  SkillCategory,
  HeritageRoute,
  EffectType,
  TriggerCondition,
  StatType,
  StatusEffectType,
} from '../enums';

export interface SkillEffect {
  type: EffectType;
  value: number;
  duration: number;
  scalingStat: StatType | null;
  statusEffectType: StatusEffectType | null;
}

const TIER_TO_GRADE: Record<number, SkillGrade> = {
  1: SkillGrade.NORMAL,
  2: SkillGrade.LEGENDARY,
  3: SkillGrade.MYTHIC,
  4: SkillGrade.IMMORTAL,
};

export class Skill {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly icon: string,
    public readonly tier: number,
    public readonly category: SkillCategory,
    public readonly heritageSynergy: HeritageRoute[],
    public readonly effect: SkillEffect,
    public readonly triggerCondition: TriggerCondition,
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

  isGradeAtLeast(grade: SkillGrade): boolean {
    const order = [SkillGrade.NORMAL, SkillGrade.LEGENDARY, SkillGrade.MYTHIC, SkillGrade.IMMORTAL];
    return order.indexOf(this.grade) >= order.indexOf(grade);
  }
}
