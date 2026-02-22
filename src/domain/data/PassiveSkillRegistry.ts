import {
  SkillTag,
  HeritageRoute,
  PassiveType,
  StatType,
} from '../enums';
import {
  PassiveSkill,
  type PassiveEffect,
} from '../entities/PassiveSkill';
import { PassiveSkillTierData, getPassiveTierData } from './PassiveSkillTierData';

type PSTD = typeof PassiveSkillTierData;

interface PassiveSkillFamilyDef {
  id: keyof PSTD;
  name: string;
  icon: string;
  tags: SkillTag[];
  heritageSynergy: HeritageRoute[];
  traits: string[];
  buildEffect: (tier: number) => PassiveEffect;
  buildDescription: (tier: number) => string;
}

function td(id: keyof PSTD, tier: number): Record<string, number> {
  return getPassiveTierData(id, tier) ?? {};
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

const TIER_SUFFIX: Record<number, string> = { 1: '', 2: ' II', 3: ' III', 4: ' IV' };

const PASSIVE_SKILL_FAMILIES: PassiveSkillFamilyDef[] = [
  {
    id: 'lifesteal', name: '흡혈', icon: '🩸',
    tags: [], heritageSynergy: [],
    traits: ['물리 공격에 효과적', '지속적 체력 회복'],
    buildEffect: (t) => ({
      type: PassiveType.LIFESTEAL, rate: td('lifesteal', t).rate,
    }),
    buildDescription: (t) => `가한 피해의 ${pct(td('lifesteal', t).rate)} HP 회복`,
  },
  {
    id: 'regen', name: '재생', icon: '💚',
    tags: [SkillTag.HP_RECOVERY], heritageSynergy: [],
    traits: ['매턴 자동 회복', '전투 지구력 향상'],
    buildEffect: (t) => ({
      type: PassiveType.REGEN, healPerTurn: td('regen', t).healPerTurn,
    }),
    buildDescription: (t) => `매턴 최대체력의 ${pct(td('regen', t).healPerTurn)} 회복`,
  },
  {
    id: 'counter', name: '반격', icon: '🛡️',
    tags: [], heritageSynergy: [HeritageRoute.KNIGHT],
    traits: ['피격 시 발동', '물리 반격'],
    buildEffect: (t) => ({
      type: PassiveType.COUNTER,
      triggerChance: td('counter', t).triggerChance,
    }),
    buildDescription: (t) => `피격 시 ${pct(td('counter', t).triggerChance)} 확률로 일반 공격 반격`,
  },
  {
    id: 'iron_shield', name: '방어막', icon: '🔰',
    tags: [], heritageSynergy: [],
    traits: ['전투 시작 시 1회', '초반 안정성'],
    buildEffect: (t) => ({
      type: PassiveType.SHIELD_ON_START, hpPercent: td('iron_shield', t).hpPercent,
    }),
    buildDescription: (t) => `전투 시작 시 최대 HP의 ${pct(td('iron_shield', t).hpPercent)} 방어막`,
  },
  {
    id: 'multi_hit', name: '연타', icon: '💫',
    tags: [], heritageSynergy: [HeritageRoute.SKULL],
    traits: ['일반 공격 전용', '확률 기반 추가 타격'],
    buildEffect: (t) => ({
      type: PassiveType.MULTI_HIT, chance: td('multi_hit', t).chance,
    }),
    buildDescription: (t) => `${pct(td('multi_hit', t).chance)} 확률로 추가 타격`,
  },
  {
    id: 'crit_mastery', name: '치명타 마스터리', icon: '🎯',
    tags: [], heritageSynergy: [HeritageRoute.RANGER],
    traits: ['물리 공격에만 적용', '높은 폭발력'],
    buildEffect: (t) => ({
      type: PassiveType.STAT_MODIFIER, stat: StatType.CRIT, value: td('crit_mastery', t).value, isPercentage: false,
    }),
    buildDescription: (t) => `치명타 확률 +${pct(td('crit_mastery', t).value)}`,
  },
  {
    id: 'rage_mastery', name: '분노 마스터리', icon: '💢',
    tags: [SkillTag.RAGE], heritageSynergy: [HeritageRoute.SKULL, HeritageRoute.KNIGHT],
    traits: ['분노 공격 강화 전용', '분노 빌드 핵심'],
    buildEffect: (t) => ({
      type: PassiveType.STAT_MODIFIER, stat: 'RAGE_POWER' as const, value: td('rage_mastery', t).value, isPercentage: true,
    }),
    buildDescription: (t) => `분노 공격 데미지 +${pct(td('rage_mastery', t).value)}`,
  },
  {
    id: 'lightning_mastery', name: '번개 마스터리', icon: '⚡',
    tags: [SkillTag.LIGHTNING], heritageSynergy: [HeritageRoute.GHOST],
    traits: ['번개 스킬 전용', '마법 빌드 시너지'],
    buildEffect: (t) => ({
      type: PassiveType.SKILL_MODIFIER,
      targetTag: SkillTag.LIGHTNING,
      modifier: { damageMultiplier: td('lightning_mastery', t).damageBonus },
    }),
    buildDescription: (t) => `번개 스킬 데미지 +${pct(td('lightning_mastery', t).damageBonus)}`,
  },
  {
    id: 'shuriken_mastery', name: '수리검 마스터리', icon: '🌀',
    tags: [SkillTag.SHURIKEN], heritageSynergy: [HeritageRoute.RANGER],
    traits: ['수리검 스킬 전용', '물리 빌드 시너지'],
    buildEffect: (t) => ({
      type: PassiveType.SKILL_MODIFIER,
      targetTag: SkillTag.SHURIKEN,
      modifier: { damageMultiplier: td('shuriken_mastery', t).damageBonus },
    }),
    buildDescription: (t) => `수리검 스킬 데미지 +${pct(td('shuriken_mastery', t).damageBonus)}`,
  },
  {
    id: 'lance_mastery', name: '광창 마스터리', icon: '🔱',
    tags: [SkillTag.LANCE], heritageSynergy: [HeritageRoute.KNIGHT],
    traits: ['광창 스킬 전용', '마법 빌드 시너지'],
    buildEffect: (t) => ({
      type: PassiveType.SKILL_MODIFIER,
      targetTag: SkillTag.LANCE,
      modifier: { damageMultiplier: td('lance_mastery', t).damageBonus },
    }),
    buildDescription: (t) => `광창 스킬 데미지 +${pct(td('lance_mastery', t).damageBonus)}`,
  },
  {
    id: 'revive', name: '부활', icon: '✨',
    tags: [], heritageSynergy: [],
    traits: ['사망 시 1회 부활', '보험형 패시브'],
    buildEffect: (t) => ({
      type: PassiveType.REVIVE, hpPercent: td('revive', t).hpPercent, maxUses: 1,
    }),
    buildDescription: (t) => `사망 시 HP ${pct(td('revive', t).hpPercent)}로 부활 (1회)`,
  },
  {
    id: 'magic_mastery', name: '마법 마스터리', icon: '🔮',
    tags: [SkillTag.MAGIC], heritageSynergy: [HeritageRoute.GHOST],
    traits: ['모든 마법 공격 강화', '마법 빌드 핵심'],
    buildEffect: (t) => ({
      type: PassiveType.STAT_MODIFIER, stat: 'MAGIC_COEFFICIENT' as const, value: td('magic_mastery', t).value, isPercentage: false,
    }),
    buildDescription: (t) => `마법 계수 +${pct(td('magic_mastery', t).value)}`,
  },
  {
    id: 'hp_fortify', name: '체력 강화', icon: '❤️',
    tags: [SkillTag.HP_RECOVERY], heritageSynergy: [HeritageRoute.KNIGHT],
    traits: ['최대 체력 증가', '방어막/재생과 시너지'],
    buildEffect: (t) => ({
      type: PassiveType.STAT_MODIFIER, stat: StatType.HP, value: td('hp_fortify', t).value, isPercentage: true,
    }),
    buildDescription: (t) => `최대 체력 +${pct(td('hp_fortify', t).value)}`,
  },
  {
    id: 'atk_fortify', name: '공격 강화', icon: '⚔️',
    tags: [], heritageSynergy: [HeritageRoute.SKULL],
    traits: ['공격력 직접 증가', '모든 빌드 범용'],
    buildEffect: (t) => ({
      type: PassiveType.STAT_MODIFIER, stat: StatType.ATK, value: td('atk_fortify', t).value, isPercentage: true,
    }),
    buildDescription: (t) => `공격력 +${pct(td('atk_fortify', t).value)}`,
  },
  {
    id: 'def_fortify', name: '방어 강화', icon: '🛡️',
    tags: [], heritageSynergy: [HeritageRoute.KNIGHT],
    traits: ['방어력 직접 증가', '모든 빌드 범용'],
    buildEffect: (t) => ({
      type: PassiveType.STAT_MODIFIER, stat: StatType.DEF, value: td('def_fortify', t).value, isPercentage: true,
    }),
    buildDescription: (t) => `방어력 +${pct(td('def_fortify', t).value)}`,
  },
  {
    id: 'low_hp_atk', name: '배수진', icon: '🔥',
    tags: [], heritageSynergy: [HeritageRoute.SKULL],
    traits: ['체력 낮을수록 공격력 증가', '실시간 적용', '하이리스크 하이리턴'],
    buildEffect: (t) => ({
      type: PassiveType.LOW_HP_MODIFIER, stat: StatType.ATK, maxBonus: td('low_hp_atk', t).maxBonus,
    }),
    buildDescription: (t) => `체력이 낮을수록 공격력 증가 (최대 +${pct(td('low_hp_atk', t).maxBonus)})`,
  },
  {
    id: 'low_hp_def', name: '불굴', icon: '🏔️',
    tags: [], heritageSynergy: [HeritageRoute.KNIGHT],
    traits: ['체력 낮을수록 방어력 증가', '실시간 적용', '생존력 향상'],
    buildEffect: (t) => ({
      type: PassiveType.LOW_HP_MODIFIER, stat: StatType.DEF, maxBonus: td('low_hp_def', t).maxBonus,
    }),
    buildDescription: (t) => `체력이 낮을수록 방어력 증가 (최대 +${pct(td('low_hp_def', t).maxBonus)})`,
  },
  {
    id: 'angel_power', name: '천사의 힘', icon: '😇',
    tags: [], heritageSynergy: [],
    traits: ['공격력 직접 증가', '모든 빌드 범용'],
    buildEffect: (t) => ({
      type: PassiveType.STAT_MODIFIER, stat: StatType.ATK, value: (td('angel_power', t) ?? td('angel_power', 4)).value, isPercentage: true,
    }),
    buildDescription: () => '공격력 +30%',
  },
];

function generateAllPassiveSkills(): PassiveSkill[] {
  const skills: PassiveSkill[] = [];
  for (const family of PASSIVE_SKILL_FAMILIES) {
    const familyData = PassiveSkillTierData[family.id];
    const tiers = Object.keys(familyData).map(Number);

    for (const tier of tiers) {
      skills.push(new PassiveSkill(
        family.id as string,
        `${family.name}${TIER_SUFFIX[tier]}`,
        family.icon,
        tier,
        family.tags,
        family.heritageSynergy,
        family.buildEffect(tier),
        family.buildDescription(tier),
      ));
    }
  }
  return skills;
}

const ALL_PASSIVE_SKILLS = generateAllPassiveSkills();

const SPECIAL_IDS = new Set(['angel_power']);

export const PassiveSkillRegistry = {
  getAll(): PassiveSkill[] {
    return ALL_PASSIVE_SKILLS;
  },

  getById(id: string, tier: number = 1): PassiveSkill | undefined {
    return ALL_PASSIVE_SKILLS.find(s => s.id === id && s.tier === tier);
  },

  getNextTier(id: string, currentTier: number): PassiveSkill | undefined {
    return ALL_PASSIVE_SKILLS.find(s => s.id === id && s.tier === currentTier + 1);
  },

  getTier1Skills(): PassiveSkill[] {
    return ALL_PASSIVE_SKILLS.filter(s => s.tier === 1 && !SPECIAL_IDS.has(s.id));
  },

  isSpecialSkill(id: string): boolean {
    return SPECIAL_IDS.has(id);
  },

  getFamilyIds(): string[] {
    return PASSIVE_SKILL_FAMILIES.map(f => f.id as string);
  },
};
