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

export class Skill {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly icon: string,
    public readonly grade: SkillGrade,
    public readonly category: SkillCategory,
    public readonly heritageSynergy: HeritageRoute[],
    public readonly effect: SkillEffect,
    public readonly triggerCondition: TriggerCondition,
  ) {}

  isSynergyWith(route: HeritageRoute): boolean {
    return this.heritageSynergy.includes(route);
  }

  isGradeAtLeast(grade: SkillGrade): boolean {
    const order = [SkillGrade.NORMAL, SkillGrade.LEGENDARY, SkillGrade.MYTHIC, SkillGrade.IMMORTAL];
    return order.indexOf(this.grade) >= order.indexOf(grade);
  }
}
