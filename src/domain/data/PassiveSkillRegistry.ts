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
    buildEffect: (t) => ({
      type: PassiveType.LIFESTEAL, rate: td('lifesteal', t).rate,
    }),
    buildDescription: (t) => `가한 피해의 ${pct(td('lifesteal', t).rate)} HP 회복`,
  },
  {
    id: 'regen', name: '재생', icon: '💚',
    tags: [SkillTag.HP_RECOVERY], heritageSynergy: [],
    buildEffect: (t) => ({
      type: PassiveType.REGEN, healPerTurn: td('regen', t).healPerTurn,
    }),
    buildDescription: (t) => `매턴 최대체력의 ${pct(td('regen', t).healPerTurn)} 회복`,
  },
  {
    id: 'counter', name: '반격', icon: '🛡️',
    tags: [], heritageSynergy: [HeritageRoute.KNIGHT],
    buildEffect: (t) => ({
      type: PassiveType.COUNTER,
      triggerChance: td('counter', t).triggerChance,
    }),
    buildDescription: (t) => `피격 시 ${pct(td('counter', t).triggerChance)} 확률로 일반 공격 반격`,
  },
  {
    id: 'iron_shield', name: '방어막', icon: '🔰',
    tags: [], heritageSynergy: [],
    buildEffect: (t) => ({
      type: PassiveType.SHIELD_ON_START, hpPercent: td('iron_shield', t).hpPercent,
    }),
    buildDescription: (t) => `전투 시작 시 최대 HP의 ${pct(td('iron_shield', t).hpPercent)} 방어막`,
  },
  {
    id: 'multi_hit', name: '연타', icon: '💫',
    tags: [], heritageSynergy: [HeritageRoute.SKULL],
    buildEffect: (t) => ({
      type: PassiveType.MULTI_HIT, chance: td('multi_hit', t).chance,
    }),
    buildDescription: (t) => `${pct(td('multi_hit', t).chance)} 확률로 추가 타격`,
  },
  {
    id: 'crit_mastery', name: '치명타 마스터리', icon: '🎯',
    tags: [], heritageSynergy: [HeritageRoute.RANGER],
    buildEffect: (t) => ({
      type: PassiveType.STAT_MODIFIER, stat: StatType.CRIT, value: td('crit_mastery', t).value, isPercentage: false,
    }),
    buildDescription: (t) => `치명타 확률 +${pct(td('crit_mastery', t).value)}`,
  },
  {
    id: 'rage_mastery', name: '분노 마스터리', icon: '💢',
    tags: [SkillTag.RAGE], heritageSynergy: [HeritageRoute.SKULL, HeritageRoute.KNIGHT],
    buildEffect: (t) => ({
      type: PassiveType.STAT_MODIFIER, stat: 'RAGE_POWER' as const, value: td('rage_mastery', t).value, isPercentage: true,
    }),
    buildDescription: (t) => `분노 공격 데미지 +${pct(td('rage_mastery', t).value)}`,
  },
  {
    id: 'lightning_mastery', name: '번개 마스터리', icon: '⚡',
    tags: [SkillTag.LIGHTNING], heritageSynergy: [HeritageRoute.GHOST],
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
    buildEffect: (t) => ({
      type: PassiveType.REVIVE, hpPercent: td('revive', t).hpPercent, maxUses: 1,
    }),
    buildDescription: (t) => `사망 시 HP ${pct(td('revive', t).hpPercent)}로 부활 (1회)`,
  },
  {
    id: 'angel_power', name: '천사의 힘', icon: '😇',
    tags: [], heritageSynergy: [],
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
