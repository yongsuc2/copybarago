import {
  SkillGrade,
  SkillCategory,
  HeritageRoute,
  EffectType,
  TriggerCondition,
  StatusEffectType,
} from '../enums';
import { Skill, type SkillEffect } from '../entities/Skill';
import { SkillDataTable as SD, getSkillDescription as desc } from './SkillDataTable';

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
    [HeritageRoute.GHOST], makeEffect(EffectType.DAMAGE, SD.lightning.damage), TriggerCondition.ON_ATTACK,
    desc('lightning')),

  new Skill('lance', 'Lance', '🔱', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [HeritageRoute.KNIGHT], makeEffect(EffectType.DAMAGE, SD.lance.damage), TriggerCondition.TURN_START,
    desc('lance')),

  new Skill('shuriken', 'Shuriken', '🌀', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [HeritageRoute.RANGER], makeEffect(EffectType.DAMAGE, SD.shuriken.damage), TriggerCondition.ON_ATTACK,
    desc('shuriken')),

  new Skill('sword_aura', 'Sword Aura', '⚔️', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [HeritageRoute.SKULL], makeEffect(EffectType.DAMAGE, SD.sword_aura.damage), TriggerCondition.ON_ATTACK,
    desc('sword_aura')),

  new Skill('poison_weapon', 'Poison Weapon', '🧪', SkillGrade.NORMAL, SkillCategory.DEBUFF,
    [], makeEffect(EffectType.DOT, SD.poison_weapon.damagePerTurn, SD.poison_weapon.duration, StatusEffectType.POISON), TriggerCondition.ON_ATTACK,
    desc('poison_weapon')),

  new Skill('lifesteal', 'Lifesteal', '🩸', SkillGrade.NORMAL, SkillCategory.SURVIVAL,
    [], makeEffect(EffectType.LIFESTEAL, SD.lifesteal.rate), TriggerCondition.PASSIVE,
    desc('lifesteal')),

  new Skill('regen', 'Regeneration', '💚', SkillGrade.NORMAL, SkillCategory.SURVIVAL,
    [], makeEffect(EffectType.HOT, SD.regen.healPerTurn, 99, StatusEffectType.REGEN), TriggerCondition.PASSIVE,
    desc('regen')),

  new Skill('counter', 'Counter Attack', '🛡️', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [HeritageRoute.KNIGHT], makeEffect(EffectType.COUNTER, SD.counter.reflectRate), TriggerCondition.ON_HIT,
    desc('counter')),

  new Skill('iron_shield', 'Iron Shield', '🔰', SkillGrade.NORMAL, SkillCategory.SURVIVAL,
    [], makeEffect(EffectType.SHIELD, SD.iron_shield.shieldRate), TriggerCondition.PASSIVE,
    desc('iron_shield')),

  new Skill('multi_hit_mastery', 'Multi-Hit Mastery', '💫', SkillGrade.LEGENDARY, SkillCategory.MASTERY,
    [HeritageRoute.SKULL], makeEffect(EffectType.MULTI_HIT, SD.multi_hit_mastery.chance), TriggerCondition.PASSIVE,
    desc('multi_hit_mastery')),

  new Skill('crit_mastery', 'Critical Mastery', '🎯', SkillGrade.LEGENDARY, SkillCategory.MASTERY,
    [HeritageRoute.RANGER], makeEffect(EffectType.BUFF, SD.crit_mastery.critBonus, 99, StatusEffectType.CRIT_UP), TriggerCondition.PASSIVE,
    desc('crit_mastery')),

  new Skill('rage_mastery', 'Rage Mastery', '💢', SkillGrade.LEGENDARY, SkillCategory.MASTERY,
    [HeritageRoute.SKULL, HeritageRoute.KNIGHT], makeEffect(EffectType.RAGE_POWER, SD.rage_mastery.powerBonus), TriggerCondition.PASSIVE,
    desc('rage_mastery')),

  new Skill('complete_rage_mastery', 'Complete Rage Mastery', '🔥', SkillGrade.LEGENDARY, SkillCategory.MASTERY,
    [HeritageRoute.SKULL, HeritageRoute.KNIGHT], makeEffect(EffectType.RAGE_BOOST, SD.complete_rage_mastery.bonusRagePerAttack), TriggerCondition.PASSIVE,
    desc('complete_rage_mastery')),

  new Skill('rage_lightning', 'Rage Lightning', '⚡', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [HeritageRoute.GHOST], makeEffect(EffectType.DAMAGE, SD.rage_lightning.damage), TriggerCondition.ON_RAGE,
    desc('rage_lightning')),

  new Skill('rage_lance', 'Rage Lance', '🔱', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [HeritageRoute.KNIGHT], makeEffect(EffectType.DAMAGE, SD.rage_lance.damage), TriggerCondition.ON_RAGE,
    desc('rage_lance')),

  new Skill('rage_flame_wave', 'Rage Flame Wave', '🔥', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [], makeEffect(EffectType.DAMAGE, SD.rage_flame_wave.damage), TriggerCondition.ON_RAGE,
    desc('rage_flame_wave')),

  new Skill('shrink_magic', 'Shrink Magic', '🔮', SkillGrade.LEGENDARY, SkillCategory.DEBUFF,
    [], makeEffect(EffectType.DEBUFF, SD.shrink_magic.reduction, SD.shrink_magic.duration, StatusEffectType.ATK_DOWN), TriggerCondition.TURN_START,
    desc('shrink_magic')),

  new Skill('hp_proficiency', 'HP Proficiency', '❤️', SkillGrade.LEGENDARY, SkillCategory.PROFICIENCY,
    [], makeEffect(EffectType.BUFF, SD.hp_proficiency.bonus, 99, StatusEffectType.DEF_UP), TriggerCondition.PASSIVE,
    desc('hp_proficiency')),

  new Skill('atk_proficiency', 'ATK Proficiency', '🗡️', SkillGrade.LEGENDARY, SkillCategory.PROFICIENCY,
    [], makeEffect(EffectType.BUFF, SD.atk_proficiency.bonus, 99, StatusEffectType.ATK_UP), TriggerCondition.PASSIVE,
    desc('atk_proficiency')),

  new Skill('def_proficiency', 'DEF Proficiency', '🏛️', SkillGrade.LEGENDARY, SkillCategory.PROFICIENCY,
    [], makeEffect(EffectType.BUFF, SD.def_proficiency.bonus, 99, StatusEffectType.DEF_UP), TriggerCondition.PASSIVE,
    desc('def_proficiency')),

  new Skill('crit_proficiency', 'CRIT Proficiency', '👁️', SkillGrade.LEGENDARY, SkillCategory.PROFICIENCY,
    [], makeEffect(EffectType.BUFF, SD.crit_proficiency.bonus, 99, StatusEffectType.CRIT_UP), TriggerCondition.PASSIVE,
    desc('crit_proficiency')),

  new Skill('defense_ultimate', 'Defense Ultimate', '🏰', SkillGrade.MYTHIC, SkillCategory.SURVIVAL,
    [], makeEffect(EffectType.BUFF, SD.defense_ultimate.bonus, 99, StatusEffectType.DEF_UP), TriggerCondition.PASSIVE,
    desc('defense_ultimate')),

  new Skill('valor_ultimate', 'Valor Ultimate', '👑', SkillGrade.MYTHIC, SkillCategory.BUFF,
    [], makeEffect(EffectType.BUFF, SD.valor_ultimate.bonus, 99, StatusEffectType.ATK_UP), TriggerCondition.PASSIVE,
    desc('valor_ultimate')),

  new Skill('revive', 'Revive', '✨', SkillGrade.MYTHIC, SkillCategory.SURVIVAL,
    [], makeEffect(EffectType.REVIVE, SD.revive.hpPercent), TriggerCondition.ON_DEATH,
    desc('revive')),

  new Skill('super_atk', 'Super ATK', '💥', SkillGrade.MYTHIC, SkillCategory.BUFF,
    [], makeEffect(EffectType.BUFF, SD.super_atk.bonus, 99, StatusEffectType.ATK_UP), TriggerCondition.PASSIVE,
    desc('super_atk')),

  new Skill('thunderstorm', 'Thunderstorm', '⛈️', SkillGrade.MYTHIC, SkillCategory.ATTACK,
    [HeritageRoute.GHOST], makeEffect(EffectType.DAMAGE, SD.thunderstorm.damage), TriggerCondition.TURN_START,
    desc('thunderstorm')),

  new Skill('tyrant', 'Tyrant', '👹', SkillGrade.MYTHIC, SkillCategory.ATTACK,
    [HeritageRoute.SKULL], makeEffect(EffectType.DAMAGE, SD.tyrant.damage), TriggerCondition.ON_ATTACK,
    desc('tyrant')),

  new Skill('angel_power', 'Angel Power', '😇', SkillGrade.IMMORTAL, SkillCategory.BUFF,
    [], makeEffect(EffectType.BUFF, SD.angel_power.bonus, 99, StatusEffectType.ATK_UP), TriggerCondition.PASSIVE,
    desc('angel_power')),

  new Skill('demon_power', 'Demon Power', '😈', SkillGrade.IMMORTAL, SkillCategory.ATTACK,
    [], makeEffect(EffectType.DAMAGE, SD.demon_power.damage), TriggerCondition.ON_ATTACK,
    desc('demon_power')),
];

const SYNERGY_MAP: Record<HeritageRoute, string[]> = {
  [HeritageRoute.SKULL]: ['sword_aura', 'multi_hit_mastery', 'rage_mastery', 'complete_rage_mastery', 'tyrant'],
  [HeritageRoute.KNIGHT]: ['lance', 'counter', 'rage_mastery', 'complete_rage_mastery', 'rage_lance'],
  [HeritageRoute.RANGER]: ['shuriken', 'crit_mastery', 'crit_proficiency'],
  [HeritageRoute.GHOST]: ['lightning', 'thunderstorm', 'rage_lightning'],
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
