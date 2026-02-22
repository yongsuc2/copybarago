import {
  SkillHierarchy,
  AttackType,
  SkillEffectType,
  SkillTag,
  HeritageRoute,
  SpecialConditionType,
  StatType,
} from '../enums';
import {
  ActiveSkill,
  type ActiveSkillEffect,
  type CompoundTrigger,
  everyNTurns,
  onSkillActivation,
  prob,
  noCondition,
  rageFull,
  trigger,
} from '../entities/ActiveSkill';
import { ActiveSkillTierData, getActiveTierData } from './ActiveSkillTierData';

type ASTD = typeof ActiveSkillTierData;

interface ActiveSkillFamilyDef {
  id: keyof ASTD;
  name: string;
  icon: string;
  hierarchy: SkillHierarchy;
  tags: SkillTag[];
  heritageSynergy: HeritageRoute[];
  traits: string[];
  buildTrigger: (tier: number) => CompoundTrigger;
  buildEffects: (tier: number) => ActiveSkillEffect[];
  buildDescription: (tier: number) => string;
}

function td(id: keyof ASTD, tier: number): Record<string, number> {
  return getActiveTierData(id, tier) ?? {};
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

const TIER_SUFFIX: Record<number, string> = { 1: '', 2: ' II', 3: ' III', 4: ' IV' };

const ACTIVE_SKILL_FAMILIES: ActiveSkillFamilyDef[] = [
  {
    id: 'ilban_attack', name: '일반 공격', icon: '⚔️',
    hierarchy: SkillHierarchy.BUILTIN,
    tags: [SkillTag.PHYSICAL],
    heritageSynergy: [],
    traits: [],
    buildTrigger: () => trigger(everyNTurns(1)),
    buildEffects: (t) => [
      { type: SkillEffectType.ATTACK, attackType: AttackType.PHYSICAL, coefficient: td('ilban_attack', t).coefficient },
      { type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'rage_accumulate', count: 1 },
    ],
    buildDescription: () => '기본 공격 + 분노 축적',
  },
  {
    id: 'bunno_attack', name: '분노 공격', icon: '💢',
    hierarchy: SkillHierarchy.BUILTIN,
    tags: [SkillTag.RAGE, SkillTag.PHYSICAL],
    heritageSynergy: [],
    traits: [],
    buildTrigger: () => trigger(everyNTurns(1), prob(1.0), rageFull()),
    buildEffects: (t) => [
      { type: SkillEffectType.CONSUME_RAGE, amount: 100 },
      { type: SkillEffectType.ATTACK, attackType: AttackType.PHYSICAL, coefficient: td('bunno_attack', t).coefficient },
    ],
    buildDescription: (t) => `분노 게이지 100 소모, 물리 공격 (계수 ${td('bunno_attack', t).coefficient})`,
  },

  {
    id: 'rage_accumulate', name: '분노 축적', icon: '💢',
    hierarchy: SkillHierarchy.LOWEST,
    tags: [SkillTag.RAGE],
    heritageSynergy: [],
    traits: [],
    buildTrigger: () => trigger(onSkillActivation('ilban_attack')),
    buildEffects: (t) => [
      { type: SkillEffectType.ADD_RAGE, amount: td('rage_accumulate', t).amount },
    ],
    buildDescription: (t) => `분노 게이지 ${td('rage_accumulate', t).amount} 추가`,
  },
  {
    id: 'hp_recovery', name: 'HP 회복', icon: '💚',
    hierarchy: SkillHierarchy.LOWEST,
    tags: [SkillTag.HP_RECOVERY],
    heritageSynergy: [],
    traits: [],
    buildTrigger: () => trigger(everyNTurns(1)),
    buildEffects: (t) => [
      { type: SkillEffectType.HEAL_HP, amount: td('hp_recovery', t).amount },
    ],
    buildDescription: (t) => `최대체력의 ${pct(td('hp_recovery', t).amount)} 회복`,
  },
  {
    id: 'lightning_summon', name: '번개 소환', icon: '⚡',
    hierarchy: SkillHierarchy.LOWEST,
    tags: [SkillTag.LIGHTNING, SkillTag.MAGIC],
    heritageSynergy: [HeritageRoute.GHOST],
    traits: [],
    buildTrigger: () => trigger(everyNTurns(1)),
    buildEffects: (t) => [
      { type: SkillEffectType.ATTACK, attackType: AttackType.MAGIC, coefficient: td('lightning_summon', t).coefficient },
    ],
    buildDescription: (t) => `번개 마법 공격 (계수 ${td('lightning_summon', t).coefficient})`,
  },
  {
    id: 'lance_summon', name: '광창 소환', icon: '🔱',
    hierarchy: SkillHierarchy.LOWEST,
    tags: [SkillTag.LANCE, SkillTag.MAGIC],
    heritageSynergy: [HeritageRoute.KNIGHT],
    traits: [],
    buildTrigger: () => trigger(everyNTurns(1)),
    buildEffects: (t) => [
      { type: SkillEffectType.ATTACK, attackType: AttackType.MAGIC, coefficient: td('lance_summon', t).coefficient },
    ],
    buildDescription: (t) => `광창 마법 공격 (계수 ${td('lance_summon', t).coefficient})`,
  },
  {
    id: 'sword_aura_summon', name: '검기 소환', icon: '⚔️',
    hierarchy: SkillHierarchy.LOWEST,
    tags: [SkillTag.SWORD_AURA, SkillTag.PHYSICAL],
    heritageSynergy: [HeritageRoute.SKULL],
    traits: [],
    buildTrigger: () => trigger(everyNTurns(1)),
    buildEffects: (t) => [
      { type: SkillEffectType.ATTACK, attackType: AttackType.PHYSICAL, coefficient: td('sword_aura_summon', t).coefficient, isAoe: true },
    ],
    buildDescription: (t) => `검기 광역 물리 공격 (계수 ${td('sword_aura_summon', t).coefficient})`,
  },
  {
    id: 'poison_inject', name: '독 주입', icon: '🧪',
    hierarchy: SkillHierarchy.LOWEST,
    tags: [SkillTag.POISON],
    heritageSynergy: [],
    traits: [],
    buildTrigger: () => trigger(everyNTurns(1)),
    buildEffects: (t) => {
      const d = td('poison_inject', t);
      return [
        { type: SkillEffectType.ATTACK, attackType: AttackType.FIXED, coefficient: d.coefficient, duration: d.duration },
      ];
    },
    buildDescription: (t) => {
      const d = td('poison_inject', t);
      return `독 고정 피해 (계수 ${d.coefficient}, ${d.duration}턴)`;
    },
  },
  {
    id: 'flame_summon', name: '화염 소환', icon: '🔥',
    hierarchy: SkillHierarchy.LOWEST,
    tags: [SkillTag.FLAME, SkillTag.MAGIC],
    heritageSynergy: [],
    traits: [],
    buildTrigger: () => trigger(everyNTurns(1)),
    buildEffects: (t) => {
      const d = td('flame_summon', t);
      return [
        { type: SkillEffectType.ATTACK, attackType: AttackType.MAGIC, coefficient: d.coefficient, duration: d.duration },
      ];
    },
    buildDescription: (t) => {
      const d = td('flame_summon', t);
      return `화염 마법 도트 (계수 ${d.coefficient}, ${d.duration}턴)`;
    },
  },

  {
    id: 'shuriken_summon', name: '수리검 소환', icon: '🌀',
    hierarchy: SkillHierarchy.LOWER,
    tags: [SkillTag.SHURIKEN, SkillTag.PHYSICAL],
    heritageSynergy: [HeritageRoute.RANGER],
    traits: [],
    buildTrigger: () => trigger(everyNTurns(1)),
    buildEffects: (t) => [
      { type: SkillEffectType.ATTACK, attackType: AttackType.PHYSICAL, coefficient: td('shuriken_summon', t).coefficient },
    ],
    buildDescription: (t) => `수리검 물리 공격 (계수 ${td('shuriken_summon', t).coefficient})`,
  },

  {
    id: 'thunder_shuriken', name: '번개 수리검', icon: '⚡🌀',
    hierarchy: SkillHierarchy.UPPER,
    tags: [SkillTag.SHURIKEN, SkillTag.LIGHTNING],
    heritageSynergy: [HeritageRoute.RANGER, HeritageRoute.GHOST],
    traits: ['수리검+번개 복합', '확률 기반 추가 피해'],
    buildTrigger: () => trigger(everyNTurns(2)),
    buildEffects: (t) => {
      const p = td('thunder_shuriken', t).injectedProbability;
      return [
        { type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'shuriken_summon', count: 1 },
        {
          type: SkillEffectType.INJECT_EFFECT, targetSkillId: 'shuriken_summon',
          injectedEffects: [{
            type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'lightning_summon', count: 1,
            triggerConditions: trigger(onSkillActivation('shuriken_summon'), prob(p)),
          }],
        },
      ];
    },
    buildDescription: (t) => `2턴마다 수리검 소환, 수리검이 ${pct(td('thunder_shuriken', t).injectedProbability)} 확률로 번개 소환`,
  },
  {
    id: 'rage_shuriken', name: '분노 수리검', icon: '💢🌀',
    hierarchy: SkillHierarchy.UPPER,
    tags: [SkillTag.SHURIKEN, SkillTag.RAGE],
    heritageSynergy: [HeritageRoute.RANGER],
    traits: ['수리검+분노 복합', '분노 게이지 빠른 축적'],
    buildTrigger: () => trigger(everyNTurns(2)),
    buildEffects: (t) => {
      const p = td('rage_shuriken', t).injectedProbability;
      return [
        { type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'shuriken_summon', count: 1 },
        {
          type: SkillEffectType.INJECT_EFFECT, targetSkillId: 'shuriken_summon',
          injectedEffects: [{
            type: SkillEffectType.ADD_RAGE, amount: td('rage_accumulate', t).amount,
          }],
        },
      ];
    },
    buildDescription: (t) => `2턴마다 수리검 소환, 수리검이 ${pct(td('rage_shuriken', t).injectedProbability)} 확률로 분노 추가`,
  },
  {
    id: 'recovery_shuriken', name: '회복 수리검', icon: '💚🌀',
    hierarchy: SkillHierarchy.UPPER,
    tags: [SkillTag.SHURIKEN, SkillTag.HP_RECOVERY],
    heritageSynergy: [HeritageRoute.RANGER],
    traits: ['수리검+회복 복합', '공격과 회복 동시'],
    buildTrigger: () => trigger(everyNTurns(2)),
    buildEffects: (t) => {
      const p = td('recovery_shuriken', t).injectedProbability;
      return [
        { type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'shuriken_summon', count: 1 },
        {
          type: SkillEffectType.INJECT_EFFECT, targetSkillId: 'shuriken_summon',
          injectedEffects: [{
            type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'hp_recovery', count: 1,
            triggerConditions: trigger(onSkillActivation('shuriken_summon'), prob(p)),
          }],
        },
      ];
    },
    buildDescription: (t) => `2턴마다 수리검 소환, 수리검이 ${pct(td('recovery_shuriken', t).injectedProbability)} 확률로 HP 회복`,
  },
  {
    id: 'poison_shuriken', name: '독 수리검', icon: '☠️🌀',
    hierarchy: SkillHierarchy.UPPER,
    tags: [SkillTag.SHURIKEN, SkillTag.POISON],
    heritageSynergy: [HeritageRoute.RANGER],
    traits: ['수리검+독 복합', '확률 기반 지속 피해'],
    buildTrigger: () => trigger(everyNTurns(2)),
    buildEffects: (t) => {
      const p = td('poison_shuriken', t).injectedProbability;
      return [
        { type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'shuriken_summon', count: 1 },
        {
          type: SkillEffectType.INJECT_EFFECT, targetSkillId: 'shuriken_summon',
          injectedEffects: [{
            type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'poison_inject', count: 1,
            triggerConditions: trigger(onSkillActivation('shuriken_summon'), prob(p)),
          }],
        },
      ];
    },
    buildDescription: (t) => `2턴마다 수리검 소환, 수리검이 ${pct(td('poison_shuriken', t).injectedProbability)} 확률로 독 주입`,
  },
  {
    id: 'shuriken_strike', name: '수리검 강타', icon: '🌀',
    hierarchy: SkillHierarchy.UPPER,
    tags: [SkillTag.SHURIKEN],
    heritageSynergy: [HeritageRoute.RANGER],
    traits: ['일반 공격 연계', '물리 공격'],
    buildTrigger: () => trigger(onSkillActivation('ilban_attack')),
    buildEffects: (t) => [
      { type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'shuriken_summon', count: td('shuriken_strike', t).count },
    ],
    buildDescription: (t) => `일반 공격 시 수리검 소환 ${td('shuriken_strike', t).count}회`,
  },
  {
    id: 'thunder_strike', name: '번개 강타', icon: '⚡',
    hierarchy: SkillHierarchy.UPPER,
    tags: [SkillTag.LIGHTNING],
    heritageSynergy: [HeritageRoute.GHOST],
    traits: ['일반 공격 연계', '마법 공격 (방어 관통 높음)'],
    buildTrigger: () => trigger(onSkillActivation('ilban_attack')),
    buildEffects: (t) => [
      { type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'lightning_summon', count: td('thunder_strike', t).count },
    ],
    buildDescription: (t) => `일반 공격 시 번개 소환 ${td('thunder_strike', t).count}회`,
  },
  {
    id: 'lance_strike', name: '광창 강타', icon: '🔱',
    hierarchy: SkillHierarchy.UPPER,
    tags: [SkillTag.LANCE],
    heritageSynergy: [HeritageRoute.KNIGHT],
    traits: ['매턴 자동 발동', '마법 공격 (방어 관통 높음)'],
    buildTrigger: () => trigger(everyNTurns(1)),
    buildEffects: (t) => [
      { type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'lance_summon', count: td('lance_strike', t).count },
    ],
    buildDescription: (t) => `매턴 광창 소환 ${td('lance_strike', t).count}회`,
  },
  {
    id: 'aura_strike', name: '검기 강타', icon: '⚔️',
    hierarchy: SkillHierarchy.UPPER,
    tags: [SkillTag.SWORD_AURA],
    heritageSynergy: [HeritageRoute.SKULL],
    traits: ['일반 공격 연계', '광역 물리 공격', '단일 계수 낮음'],
    buildTrigger: () => trigger(onSkillActivation('ilban_attack')),
    buildEffects: (t) => [
      { type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'sword_aura_summon', count: td('aura_strike', t).count },
    ],
    buildDescription: (t) => `일반 공격 시 검기 소환 ${td('aura_strike', t).count}회`,
  },
  {
    id: 'bunno_thunder', name: '분노 공격 번개', icon: '💢⚡',
    hierarchy: SkillHierarchy.UPPER,
    tags: [SkillTag.RAGE, SkillTag.LIGHTNING],
    heritageSynergy: [HeritageRoute.GHOST],
    traits: ['분노 공격 연계', '마법 공격 (방어 관통 높음)'],
    buildTrigger: () => trigger(onSkillActivation('bunno_attack')),
    buildEffects: (t) => [
      { type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'lightning_summon', count: td('bunno_thunder', t).count },
    ],
    buildDescription: (t) => `분노 공격 시 번개 소환 ${td('bunno_thunder', t).count}회`,
  },
  {
    id: 'bunno_lance', name: '분노 공격 광창', icon: '💢🔱',
    hierarchy: SkillHierarchy.UPPER,
    tags: [SkillTag.RAGE, SkillTag.LANCE],
    heritageSynergy: [HeritageRoute.KNIGHT],
    traits: ['분노 공격 연계', '마법 공격 (방어 관통 높음)'],
    buildTrigger: () => trigger(onSkillActivation('bunno_attack')),
    buildEffects: (t) => [
      { type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'lance_summon', count: td('bunno_lance', t).count },
    ],
    buildDescription: (t) => `분노 공격 시 광창 소환 ${td('bunno_lance', t).count}회`,
  },
  {
    id: 'bunno_flame', name: '분노 공격 화염', icon: '💢🔥',
    hierarchy: SkillHierarchy.UPPER,
    tags: [SkillTag.RAGE, SkillTag.FLAME],
    heritageSynergy: [],
    traits: ['분노 공격 연계', '도트 데미지'],
    buildTrigger: () => trigger(onSkillActivation('bunno_attack')),
    buildEffects: (t) => [
      { type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'flame_summon', count: td('bunno_flame', t).count },
    ],
    buildDescription: (t) => `분노 공격 시 화염 소환 ${td('bunno_flame', t).count}회`,
  },
  {
    id: 'rage_gauge_boost', name: '분노 게이지 증가', icon: '💢',
    hierarchy: SkillHierarchy.UPPER,
    tags: [SkillTag.NORMAL_ATTACK, SkillTag.RAGE],
    heritageSynergy: [],
    traits: ['일반 공격 연계', '분노 게이지 빠른 축적'],
    buildTrigger: () => trigger(onSkillActivation('ilban_attack')),
    buildEffects: (t) => [
      { type: SkillEffectType.ADD_RAGE, amount: td('rage_gauge_boost', t).amount },
    ],
    buildDescription: (t) => `일반 공격 시 분노 게이지 ${td('rage_gauge_boost', t).amount} 추가`,
  },
  {
    id: 'venom_sword', name: '지독한 검', icon: '🧪',
    hierarchy: SkillHierarchy.UPPER,
    tags: [SkillTag.NORMAL_ATTACK, SkillTag.POISON],
    heritageSynergy: [],
    traits: ['일반 공격 연계', '고정 피해 (방어 무시)'],
    buildTrigger: () => trigger(onSkillActivation('ilban_attack')),
    buildEffects: () => [
      { type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'poison_inject', count: 1 },
    ],
    buildDescription: () => '일반 공격 시 독 주입',
  },
  {
    id: 'tyrant', name: '폭군의 일격', icon: '👹',
    hierarchy: SkillHierarchy.UPPER,
    tags: [SkillTag.PHYSICAL],
    heritageSynergy: [HeritageRoute.SKULL],
    traits: ['일반 공격 연계', '물리 추가 타격'],
    buildTrigger: () => trigger(onSkillActivation('ilban_attack')),
    buildEffects: (t) => [
      { type: SkillEffectType.ATTACK, attackType: AttackType.PHYSICAL, coefficient: td('tyrant', t).coefficient },
    ],
    buildDescription: (t) => `일반 공격 시 물리 추가 공격 (계수 ${td('tyrant', t).coefficient})`,
  },
  {
    id: 'shrink_magic', name: '축소 마법', icon: '🔮',
    hierarchy: SkillHierarchy.UPPER,
    tags: [SkillTag.DEBUFF],
    heritageSynergy: [],
    traits: ['매턴 자동 발동', '적 약화 디버프'],
    buildTrigger: () => trigger(everyNTurns(1)),
    buildEffects: (t) => {
      const d = td('shrink_magic', t);
      return [
        { type: SkillEffectType.DEBUFF, stat: StatType.ATK, reduction: d.reduction, duration: d.duration },
      ];
    },
    buildDescription: (t) => {
      const d = td('shrink_magic', t);
      return `매턴 적 ATK ${pct(d.reduction)} 감소 (${d.duration}턴)`;
    },
  },
  {
    id: 'demon_power', name: '악마의 힘', icon: '😈',
    hierarchy: SkillHierarchy.UPPER,
    tags: [SkillTag.MAGIC],
    heritageSynergy: [],
    traits: ['일반 공격 연계', '마법 추가 타격'],
    buildTrigger: () => trigger(onSkillActivation('ilban_attack')),
    buildEffects: (t) => [
      { type: SkillEffectType.ATTACK, attackType: AttackType.MAGIC, coefficient: (td('demon_power', t) ?? td('demon_power', 4)).coefficient },
    ],
    buildDescription: () => '일반 공격 시 마법 추가 공격',
  },
];

function generateAllActiveSkills(): ActiveSkill[] {
  const skills: ActiveSkill[] = [];
  for (const family of ACTIVE_SKILL_FAMILIES) {
    const familyData = ActiveSkillTierData[family.id];
    const tiers = Object.keys(familyData).map(Number);

    for (const tier of tiers) {
      skills.push(new ActiveSkill(
        family.id as string,
        `${family.name}${TIER_SUFFIX[tier]}`,
        family.icon,
        family.hierarchy,
        tier,
        family.tags,
        family.heritageSynergy,
        family.buildTrigger(tier),
        family.buildEffects(tier),
        family.buildDescription(tier),
      ));
    }
  }
  return skills;
}

const ALL_ACTIVE_SKILLS = generateAllActiveSkills();

const BUILTIN_IDS = new Set(
  ACTIVE_SKILL_FAMILIES
    .filter(f => f.hierarchy === SkillHierarchy.BUILTIN)
    .map(f => f.id as string)
);

const SPECIAL_IDS = new Set(['demon_power']);

const UPPER_FAMILIES = ACTIVE_SKILL_FAMILIES
  .filter(f => f.hierarchy === SkillHierarchy.UPPER)
  .map(f => f.id as string);

export const ActiveSkillRegistry = {
  getAll(): ActiveSkill[] {
    return ALL_ACTIVE_SKILLS;
  },

  getById(id: string, tier: number = 1): ActiveSkill | undefined {
    return ALL_ACTIVE_SKILLS.find(s => s.id === id && s.tier === tier);
  },

  getNextTier(id: string, currentTier: number): ActiveSkill | undefined {
    return ALL_ACTIVE_SKILLS.find(s => s.id === id && s.tier === currentTier + 1);
  },

  getBuiltinSkills(): ActiveSkill[] {
    return ALL_ACTIVE_SKILLS.filter(s => s.hierarchy === SkillHierarchy.BUILTIN && s.tier === 1);
  },

  getUpperTier1Skills(): ActiveSkill[] {
    return ALL_ACTIVE_SKILLS.filter(
      s => s.hierarchy === SkillHierarchy.UPPER && s.tier === 1 && !SPECIAL_IDS.has(s.id)
    );
  },

  isBuiltinSkill(id: string): boolean {
    return BUILTIN_IDS.has(id);
  },

  isSpecialSkill(id: string): boolean {
    return SPECIAL_IDS.has(id);
  },

  getUpperFamilyIds(): string[] {
    return UPPER_FAMILIES;
  },
};
