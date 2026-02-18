import {
  SkillGrade,
  SkillCategory,
  HeritageRoute,
  EffectType,
  TriggerCondition,
  StatusEffectType,
} from '../enums';
import { Skill, type SkillEffect } from '../entities/Skill';
import { SkillDataTable, getSkillDescription } from './SkillDataTable';

type SD = typeof SkillDataTable;

function makeEffect(
  type: EffectType,
  value: number,
  duration: number = 0,
  statusEffectType: StatusEffectType | null = null,
): SkillEffect {
  return { type, value, duration, scalingStat: null, statusEffectType };
}

const TIER_SUFFIX: Record<number, string> = { 1: '', 2: ' II', 3: ' III', 4: ' IV' };

interface SkillFamilyDef {
  id: keyof SD;
  name: string;
  icon: string;
  category: SkillCategory;
  heritageSynergy: HeritageRoute[];
  triggerCondition: TriggerCondition;
  buildEffect: (tier: number) => SkillEffect;
}

function td(id: keyof SD, tier: number): Record<string, number> {
  const family = SkillDataTable[id] as Record<number, unknown>;
  return family[tier] as Record<string, number>;
}

const SKILL_FAMILIES: SkillFamilyDef[] = [
  {
    id: 'lightning', name: 'Lightning', icon: '⚡',
    category: SkillCategory.ATTACK, heritageSynergy: [HeritageRoute.GHOST],
    triggerCondition: TriggerCondition.ON_ATTACK,
    buildEffect: t => makeEffect(EffectType.DAMAGE, td('lightning', t).damage),
  },
  {
    id: 'lance', name: 'Lance', icon: '🔱',
    category: SkillCategory.ATTACK, heritageSynergy: [HeritageRoute.KNIGHT],
    triggerCondition: TriggerCondition.TURN_START,
    buildEffect: t => makeEffect(EffectType.DAMAGE, td('lance', t).damage),
  },
  {
    id: 'shuriken', name: 'Shuriken', icon: '🌀',
    category: SkillCategory.ATTACK, heritageSynergy: [HeritageRoute.RANGER],
    triggerCondition: TriggerCondition.ON_ATTACK,
    buildEffect: t => makeEffect(EffectType.DAMAGE, td('shuriken', t).damage),
  },
  {
    id: 'sword_aura', name: 'Sword Aura', icon: '⚔️',
    category: SkillCategory.ATTACK, heritageSynergy: [HeritageRoute.SKULL],
    triggerCondition: TriggerCondition.ON_ATTACK,
    buildEffect: t => makeEffect(EffectType.DAMAGE, td('sword_aura', t).damage),
  },
  {
    id: 'poison_weapon', name: 'Poison Weapon', icon: '🧪',
    category: SkillCategory.DEBUFF, heritageSynergy: [],
    triggerCondition: TriggerCondition.ON_ATTACK,
    buildEffect: t => {
      const d = td('poison_weapon', t);
      return makeEffect(EffectType.DOT, d.damagePerTurn, d.duration, StatusEffectType.POISON);
    },
  },
  {
    id: 'lifesteal', name: 'Lifesteal', icon: '🩸',
    category: SkillCategory.SURVIVAL, heritageSynergy: [],
    triggerCondition: TriggerCondition.PASSIVE,
    buildEffect: t => makeEffect(EffectType.LIFESTEAL, td('lifesteal', t).rate),
  },
  {
    id: 'regen', name: 'Regeneration', icon: '💚',
    category: SkillCategory.SURVIVAL, heritageSynergy: [],
    triggerCondition: TriggerCondition.PASSIVE,
    buildEffect: t => makeEffect(EffectType.HOT, td('regen', t).healPerTurn, 99, StatusEffectType.REGEN),
  },
  {
    id: 'counter', name: 'Counter Attack', icon: '🛡️',
    category: SkillCategory.ATTACK, heritageSynergy: [HeritageRoute.KNIGHT],
    triggerCondition: TriggerCondition.ON_HIT,
    buildEffect: t => makeEffect(EffectType.COUNTER, td('counter', t).reflectRate),
  },
  {
    id: 'iron_shield', name: 'Iron Shield', icon: '🔰',
    category: SkillCategory.SURVIVAL, heritageSynergy: [],
    triggerCondition: TriggerCondition.PASSIVE,
    buildEffect: t => makeEffect(EffectType.SHIELD, td('iron_shield', t).shieldRate),
  },
  {
    id: 'multi_hit_mastery', name: 'Multi-Hit Mastery', icon: '💫',
    category: SkillCategory.MASTERY, heritageSynergy: [HeritageRoute.SKULL],
    triggerCondition: TriggerCondition.PASSIVE,
    buildEffect: t => makeEffect(EffectType.MULTI_HIT, td('multi_hit_mastery', t).chance),
  },
  {
    id: 'crit_mastery', name: 'Critical Mastery', icon: '🎯',
    category: SkillCategory.MASTERY, heritageSynergy: [HeritageRoute.RANGER],
    triggerCondition: TriggerCondition.PASSIVE,
    buildEffect: t => makeEffect(EffectType.BUFF, td('crit_mastery', t).critBonus, 99, StatusEffectType.CRIT_UP),
  },
  {
    id: 'rage_mastery', name: 'Rage Mastery', icon: '💢',
    category: SkillCategory.MASTERY, heritageSynergy: [HeritageRoute.SKULL, HeritageRoute.KNIGHT],
    triggerCondition: TriggerCondition.PASSIVE,
    buildEffect: t => makeEffect(EffectType.RAGE_POWER, td('rage_mastery', t).powerBonus),
  },
  {
    id: 'complete_rage_mastery', name: 'Complete Rage Mastery', icon: '🔥',
    category: SkillCategory.MASTERY, heritageSynergy: [HeritageRoute.SKULL, HeritageRoute.KNIGHT],
    triggerCondition: TriggerCondition.PASSIVE,
    buildEffect: t => makeEffect(EffectType.RAGE_BOOST, td('complete_rage_mastery', t).bonusRagePerAttack),
  },
  {
    id: 'rage_lightning', name: 'Rage Lightning', icon: '⚡',
    category: SkillCategory.ATTACK, heritageSynergy: [HeritageRoute.GHOST],
    triggerCondition: TriggerCondition.ON_RAGE,
    buildEffect: t => makeEffect(EffectType.DAMAGE, td('rage_lightning', t).damage),
  },
  {
    id: 'rage_lance', name: 'Rage Lance', icon: '🔱',
    category: SkillCategory.ATTACK, heritageSynergy: [HeritageRoute.KNIGHT],
    triggerCondition: TriggerCondition.ON_RAGE,
    buildEffect: t => makeEffect(EffectType.DAMAGE, td('rage_lance', t).damage),
  },
  {
    id: 'rage_flame_wave', name: 'Rage Flame Wave', icon: '🔥',
    category: SkillCategory.ATTACK, heritageSynergy: [],
    triggerCondition: TriggerCondition.ON_RAGE,
    buildEffect: t => makeEffect(EffectType.DAMAGE, td('rage_flame_wave', t).damage),
  },
  {
    id: 'shrink_magic', name: 'Shrink Magic', icon: '🔮',
    category: SkillCategory.DEBUFF, heritageSynergy: [],
    triggerCondition: TriggerCondition.TURN_START,
    buildEffect: t => {
      const d = td('shrink_magic', t);
      return makeEffect(EffectType.DEBUFF, d.reduction, d.duration, StatusEffectType.ATK_DOWN);
    },
  },
  {
    id: 'defense_ultimate', name: 'Defense Ultimate', icon: '🏰',
    category: SkillCategory.SURVIVAL, heritageSynergy: [],
    triggerCondition: TriggerCondition.PASSIVE,
    buildEffect: t => makeEffect(EffectType.BUFF, td('defense_ultimate', t).bonus, 99, StatusEffectType.DEF_UP),
  },
  {
    id: 'valor_ultimate', name: 'Valor Ultimate', icon: '👑',
    category: SkillCategory.BUFF, heritageSynergy: [],
    triggerCondition: TriggerCondition.PASSIVE,
    buildEffect: t => makeEffect(EffectType.BUFF, td('valor_ultimate', t).bonus, 99, StatusEffectType.ATK_UP),
  },
  {
    id: 'revive', name: 'Revive', icon: '✨',
    category: SkillCategory.SURVIVAL, heritageSynergy: [],
    triggerCondition: TriggerCondition.ON_DEATH,
    buildEffect: t => makeEffect(EffectType.REVIVE, td('revive', t).hpPercent),
  },
  {
    id: 'super_atk', name: 'Super ATK', icon: '💥',
    category: SkillCategory.BUFF, heritageSynergy: [],
    triggerCondition: TriggerCondition.PASSIVE,
    buildEffect: t => makeEffect(EffectType.BUFF, td('super_atk', t).bonus, 99, StatusEffectType.ATK_UP),
  },
  {
    id: 'thunderstorm', name: 'Thunderstorm', icon: '⛈️',
    category: SkillCategory.ATTACK, heritageSynergy: [HeritageRoute.GHOST],
    triggerCondition: TriggerCondition.TURN_START,
    buildEffect: t => makeEffect(EffectType.DAMAGE, td('thunderstorm', t).damage),
  },
  {
    id: 'tyrant', name: 'Tyrant', icon: '👹',
    category: SkillCategory.ATTACK, heritageSynergy: [HeritageRoute.SKULL],
    triggerCondition: TriggerCondition.ON_ATTACK,
    buildEffect: t => makeEffect(EffectType.DAMAGE, td('tyrant', t).damage),
  },
];

const SPECIAL_SKILLS: Skill[] = [
  new Skill('angel_power', 'Angel Power', '😇', 4, SkillCategory.BUFF,
    [], makeEffect(EffectType.BUFF, td('angel_power', 4).bonus, 99, StatusEffectType.ATK_UP),
    TriggerCondition.PASSIVE, getSkillDescription('angel_power', 4)),
  new Skill('demon_power', 'Demon Power', '😈', 4, SkillCategory.ATTACK,
    [], makeEffect(EffectType.DAMAGE, td('demon_power', 4).damage),
    TriggerCondition.ON_ATTACK, getSkillDescription('demon_power', 4)),
];

const SPECIAL_IDS = new Set(SPECIAL_SKILLS.map(s => s.id));

function generateAllSkills(): Skill[] {
  const skills: Skill[] = [];
  for (const family of SKILL_FAMILIES) {
    for (let tier = 1; tier <= 4; tier++) {
      skills.push(new Skill(
        family.id as string,
        `${family.name}${TIER_SUFFIX[tier]}`,
        family.icon,
        tier,
        family.category,
        family.heritageSynergy,
        family.buildEffect(tier),
        family.triggerCondition,
        getSkillDescription(family.id as string, tier),
      ));
    }
  }
  return [...skills, ...SPECIAL_SKILLS];
}

const ALL_SKILLS = generateAllSkills();

const SYNERGY_MAP: Record<HeritageRoute, string[]> = {
  [HeritageRoute.SKULL]: ['sword_aura', 'multi_hit_mastery', 'rage_mastery', 'complete_rage_mastery', 'tyrant'],
  [HeritageRoute.KNIGHT]: ['lance', 'counter', 'rage_mastery', 'complete_rage_mastery', 'rage_lance'],
  [HeritageRoute.RANGER]: ['shuriken', 'crit_mastery'],
  [HeritageRoute.GHOST]: ['lightning', 'thunderstorm', 'rage_lightning'],
};

export const SkillTable = {
  getAllSkills(): Skill[] {
    return ALL_SKILLS;
  },

  getSkillById(id: string, tier: number = 1): Skill | undefined {
    return ALL_SKILLS.find(s => s.id === id && s.tier === tier);
  },

  getNextTierSkill(id: string, currentTier: number): Skill | undefined {
    return ALL_SKILLS.find(s => s.id === id && s.tier === currentTier + 1);
  },

  getTier1Skills(): Skill[] {
    return ALL_SKILLS.filter(s => s.tier === 1 && !SPECIAL_IDS.has(s.id));
  },

  isSpecialSkill(id: string): boolean {
    return SPECIAL_IDS.has(id);
  },

  getSynergySkills(route: HeritageRoute): string[] {
    return SYNERGY_MAP[route];
  },

  getSkillsByGrade(grade: SkillGrade): Skill[] {
    return ALL_SKILLS.filter(s => s.grade === grade);
  },

  getRandomSkillPool(count: number, excludeIds: string[] = []): Skill[] {
    const available = ALL_SKILLS.filter(s => s.tier === 1 && !excludeIds.includes(s.id) && !SPECIAL_IDS.has(s.id));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },
};
