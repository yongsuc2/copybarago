import {
  SkillHierarchy,
  SkillGrade,
  AttackType,
  SkillEffectType,
  SpecialConditionType,
  SkillTag,
  HeritageRoute,
  StatType,
} from '../enums';

export interface TurnBasedTrigger {
  kind: 'EVERY_N_TURNS';
  interval: number;
}

export interface SkillActivationTrigger {
  kind: 'ON_SKILL_ACTIVATION';
  skillId: string;
}

export type TriggerCondition1 = TurnBasedTrigger | SkillActivationTrigger;

export interface TriggerCondition2 {
  probability: number;
}

export interface ConditionNone {
  type: SpecialConditionType.NONE;
}

export interface ConditionRageFull {
  type: SpecialConditionType.RAGE_FULL;
}

export interface ConditionHpBelow {
  type: SpecialConditionType.HP_BELOW;
  threshold: number;
}

export interface ConditionHpAbove {
  type: SpecialConditionType.HP_ABOVE;
  threshold: number;
}

export interface ConditionHpBelowOnce {
  type: SpecialConditionType.HP_BELOW_ONCE;
  threshold: number;
}

export type TriggerCondition3 =
  | ConditionNone
  | ConditionRageFull
  | ConditionHpBelow
  | ConditionHpAbove
  | ConditionHpBelowOnce;

export interface CompoundTrigger {
  condition1: TriggerCondition1;
  condition2: TriggerCondition2;
  condition3: TriggerCondition3;
}

export interface AttackEffect {
  type: SkillEffectType.ATTACK;
  attackType: AttackType;
  coefficient: number;
  duration?: number;
  isAoe?: boolean;
  isTargetHpBased?: boolean;
  stunChance?: number;
  stunDuration?: number;
}

export interface TriggerSkillEffect {
  type: SkillEffectType.TRIGGER_SKILL;
  targetSkillId: string;
  count: number;
  triggerConditions?: CompoundTrigger;
}

export interface InjectEffectEffect {
  type: SkillEffectType.INJECT_EFFECT;
  targetSkillId: string;
  injectedEffects: ActiveSkillEffect[];
}

export interface HealHpEffect {
  type: SkillEffectType.HEAL_HP;
  amount: number;
}

export interface AddRageEffect {
  type: SkillEffectType.ADD_RAGE;
  amount: number;
}

export interface ConsumeRageEffect {
  type: SkillEffectType.CONSUME_RAGE;
  amount: number;
}

export interface DebuffEffect {
  type: SkillEffectType.DEBUFF;
  stat: StatType;
  reduction: number;
  duration: number;
}

export type ActiveSkillEffect =
  | AttackEffect
  | TriggerSkillEffect
  | InjectEffectEffect
  | HealHpEffect
  | AddRageEffect
  | ConsumeRageEffect
  | DebuffEffect;

const TIER_TO_GRADE: Record<number, SkillGrade> = {
  1: SkillGrade.NORMAL,
  2: SkillGrade.LEGENDARY,
  3: SkillGrade.MYTHIC,
  4: SkillGrade.IMMORTAL,
};

export class ActiveSkill {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly icon: string,
    public readonly hierarchy: SkillHierarchy,
    public readonly tier: number,
    public readonly tags: SkillTag[],
    public readonly heritageSynergy: HeritageRoute[],
    public readonly trigger: CompoundTrigger,
    public readonly effects: ActiveSkillEffect[],
    public readonly description: string = '',
  ) {}

  get grade(): SkillGrade {
    return TIER_TO_GRADE[this.tier] ?? SkillGrade.NORMAL;
  }

  isMaxTier(): boolean {
    return this.tier >= 4;
  }

  hasTag(tag: SkillTag): boolean {
    return this.tags.includes(tag);
  }

  isSynergyWith(route: HeritageRoute): boolean {
    return this.heritageSynergy.includes(route);
  }
}

export function everyNTurns(interval: number): TriggerCondition1 {
  return { kind: 'EVERY_N_TURNS', interval };
}

export function onSkillActivation(skillId: string): TriggerCondition1 {
  return { kind: 'ON_SKILL_ACTIVATION', skillId };
}

export function prob(probability: number): TriggerCondition2 {
  return { probability };
}

export function noCondition(): TriggerCondition3 {
  return { type: SpecialConditionType.NONE };
}

export function rageFull(): TriggerCondition3 {
  return { type: SpecialConditionType.RAGE_FULL };
}

export function trigger(
  c1: TriggerCondition1,
  c2: TriggerCondition2 = prob(1.0),
  c3: TriggerCondition3 = noCondition(),
): CompoundTrigger {
  return { condition1: c1, condition2: c2, condition3: c3 };
}
