import {
  SkillGrade,
  SkillCategory,
  HeritageRoute,
  EffectType,
  TriggerCondition,
  StatusEffectType,
} from '../enums';
import { Skill, type SkillEffect } from '../entities/Skill';

function makeEffect(
  type: EffectType,
  value: number,
  duration: number = 0,
  statusEffectType: StatusEffectType | null = null,
): SkillEffect {
  return { type, value, duration, scalingStat: null, statusEffectType };
}

const ALL_SKILLS: Skill[] = [
  new Skill('lightning', 'Lightning', '⚡', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [HeritageRoute.GHOST], makeEffect(EffectType.DAMAGE, 15), TriggerCondition.ON_ATTACK),

  new Skill('lance', 'Lance', '🔱', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [HeritageRoute.KNIGHT], makeEffect(EffectType.DAMAGE, 12), TriggerCondition.TURN_START),

  new Skill('shuriken', 'Shuriken', '🌀', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [HeritageRoute.RANGER], makeEffect(EffectType.DAMAGE, 10), TriggerCondition.ON_ATTACK),

  new Skill('sword_aura', 'Sword Aura', '⚔️', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [HeritageRoute.SKULL], makeEffect(EffectType.DAMAGE, 12), TriggerCondition.ON_ATTACK),

  new Skill('poison_weapon', 'Poison Weapon', '🧪', SkillGrade.NORMAL, SkillCategory.DEBUFF,
    [], makeEffect(EffectType.DOT, 8, 3, StatusEffectType.POISON), TriggerCondition.ON_ATTACK),

  new Skill('lifesteal', 'Lifesteal', '🩸', SkillGrade.NORMAL, SkillCategory.SURVIVAL,
    [], makeEffect(EffectType.LIFESTEAL, 0.15), TriggerCondition.PASSIVE),

  new Skill('regen', 'Regeneration', '💚', SkillGrade.NORMAL, SkillCategory.SURVIVAL,
    [], makeEffect(EffectType.HOT, 10, 99, StatusEffectType.REGEN), TriggerCondition.PASSIVE),

  new Skill('counter', 'Counter Attack', '🛡️', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [HeritageRoute.KNIGHT], makeEffect(EffectType.COUNTER, 0.5), TriggerCondition.ON_HIT),

  new Skill('multi_hit_mastery', 'Multi-Hit Mastery', '💫', SkillGrade.LEGENDARY, SkillCategory.MASTERY,
    [HeritageRoute.SKULL], makeEffect(EffectType.MULTI_HIT, 3), TriggerCondition.PASSIVE),

  new Skill('crit_mastery', 'Critical Mastery', '🎯', SkillGrade.LEGENDARY, SkillCategory.MASTERY,
    [HeritageRoute.RANGER], makeEffect(EffectType.BUFF, 0.15, 99, StatusEffectType.CRIT_UP), TriggerCondition.PASSIVE),

  new Skill('rage_mastery', 'Rage Mastery', '💢', SkillGrade.LEGENDARY, SkillCategory.MASTERY,
    [HeritageRoute.SKULL, HeritageRoute.KNIGHT], makeEffect(EffectType.BUFF, 0.2, 99, StatusEffectType.ATK_UP), TriggerCondition.PASSIVE),

  new Skill('shrink_magic', 'Shrink Magic', '🔮', SkillGrade.LEGENDARY, SkillCategory.DEBUFF,
    [], makeEffect(EffectType.DEBUFF, 0.2, 3, StatusEffectType.ATK_DOWN), TriggerCondition.TURN_START),

  new Skill('hp_proficiency', 'HP Proficiency', '❤️', SkillGrade.LEGENDARY, SkillCategory.PROFICIENCY,
    [], makeEffect(EffectType.BUFF, 0.1, 99, StatusEffectType.DEF_UP), TriggerCondition.PASSIVE),

  new Skill('atk_proficiency', 'ATK Proficiency', '🗡️', SkillGrade.LEGENDARY, SkillCategory.PROFICIENCY,
    [], makeEffect(EffectType.BUFF, 0.1, 99, StatusEffectType.ATK_UP), TriggerCondition.PASSIVE),

  new Skill('def_proficiency', 'DEF Proficiency', '🏛️', SkillGrade.LEGENDARY, SkillCategory.PROFICIENCY,
    [], makeEffect(EffectType.BUFF, 0.1, 99, StatusEffectType.DEF_UP), TriggerCondition.PASSIVE),

  new Skill('crit_proficiency', 'CRIT Proficiency', '👁️', SkillGrade.LEGENDARY, SkillCategory.PROFICIENCY,
    [], makeEffect(EffectType.BUFF, 0.1, 99, StatusEffectType.CRIT_UP), TriggerCondition.PASSIVE),

  new Skill('defense_ultimate', 'Defense Ultimate', '🏰', SkillGrade.MYTHIC, SkillCategory.SURVIVAL,
    [], makeEffect(EffectType.BUFF, 0.5, 99, StatusEffectType.DEF_UP), TriggerCondition.PASSIVE),

  new Skill('valor_ultimate', 'Valor Ultimate', '👑', SkillGrade.MYTHIC, SkillCategory.BUFF,
    [], makeEffect(EffectType.BUFF, 0.5, 99, StatusEffectType.ATK_UP), TriggerCondition.PASSIVE),

  new Skill('revive', 'Revive', '✨', SkillGrade.MYTHIC, SkillCategory.SURVIVAL,
    [], makeEffect(EffectType.REVIVE, 0.3), TriggerCondition.ON_DEATH),

  new Skill('super_atk', 'Super ATK', '💥', SkillGrade.MYTHIC, SkillCategory.BUFF,
    [], makeEffect(EffectType.BUFF, 0.8, 99, StatusEffectType.ATK_UP), TriggerCondition.PASSIVE),

  new Skill('thunderstorm', 'Thunderstorm', '⛈️', SkillGrade.MYTHIC, SkillCategory.ATTACK,
    [HeritageRoute.GHOST], makeEffect(EffectType.DAMAGE, 40), TriggerCondition.TURN_START),

  new Skill('tyrant', 'Tyrant', '👹', SkillGrade.MYTHIC, SkillCategory.ATTACK,
    [HeritageRoute.SKULL], makeEffect(EffectType.DAMAGE, 35), TriggerCondition.ON_ATTACK),

  new Skill('angel_power', 'Angel Power', '😇', SkillGrade.IMMORTAL, SkillCategory.BUFF,
    [], makeEffect(EffectType.BUFF, 1.0, 99, StatusEffectType.ATK_UP), TriggerCondition.PASSIVE),

  new Skill('demon_power', 'Demon Power', '😈', SkillGrade.IMMORTAL, SkillCategory.ATTACK,
    [], makeEffect(EffectType.DAMAGE, 60), TriggerCondition.ON_ATTACK),
];

const SYNERGY_MAP: Record<HeritageRoute, string[]> = {
  [HeritageRoute.SKULL]: ['sword_aura', 'multi_hit_mastery', 'rage_mastery', 'tyrant'],
  [HeritageRoute.KNIGHT]: ['lance', 'counter', 'rage_mastery'],
  [HeritageRoute.RANGER]: ['shuriken', 'crit_mastery', 'crit_proficiency'],
  [HeritageRoute.GHOST]: ['lightning', 'thunderstorm'],
};

export const SkillTable = {
  getAllSkills(): Skill[] {
    return ALL_SKILLS;
  },

  getSkillById(id: string): Skill | undefined {
    return ALL_SKILLS.find(s => s.id === id);
  },

  getSynergySkills(route: HeritageRoute): string[] {
    return SYNERGY_MAP[route];
  },

  getSkillsByGrade(grade: SkillGrade): Skill[] {
    return ALL_SKILLS.filter(s => s.grade === grade);
  },

  getRandomSkillPool(count: number, excludeIds: string[] = []): Skill[] {
    const available = ALL_SKILLS.filter(s => !excludeIds.includes(s.id));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  },
};
