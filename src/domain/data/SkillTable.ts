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
    [HeritageRoute.GHOST], makeEffect(EffectType.DAMAGE, 15), TriggerCondition.ON_ATTACK,
    '공격 시 번개를 내려 15의 추가 피해'),

  new Skill('lance', 'Lance', '🔱', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [HeritageRoute.KNIGHT], makeEffect(EffectType.DAMAGE, 12), TriggerCondition.TURN_START,
    '턴 시작 시 창으로 12의 선제 피해'),

  new Skill('shuriken', 'Shuriken', '🌀', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [HeritageRoute.RANGER], makeEffect(EffectType.DAMAGE, 10), TriggerCondition.ON_ATTACK,
    '공격 시 수리검으로 10의 추가 피해'),

  new Skill('sword_aura', 'Sword Aura', '⚔️', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [HeritageRoute.SKULL], makeEffect(EffectType.DAMAGE, 12), TriggerCondition.ON_ATTACK,
    '공격 시 검기로 12의 추가 피해'),

  new Skill('poison_weapon', 'Poison Weapon', '🧪', SkillGrade.NORMAL, SkillCategory.DEBUFF,
    [], makeEffect(EffectType.DOT, 8, 3, StatusEffectType.POISON), TriggerCondition.ON_ATTACK,
    '공격 시 독을 부여하여 3턴간 매턴 8 피해'),

  new Skill('lifesteal', 'Lifesteal', '🩸', SkillGrade.NORMAL, SkillCategory.SURVIVAL,
    [], makeEffect(EffectType.LIFESTEAL, 0.15), TriggerCondition.PASSIVE,
    '가한 피해의 15%만큼 체력 회복'),

  new Skill('regen', 'Regeneration', '💚', SkillGrade.NORMAL, SkillCategory.SURVIVAL,
    [], makeEffect(EffectType.HOT, 10, 99, StatusEffectType.REGEN), TriggerCondition.PASSIVE,
    '매 턴 체력 10 회복'),

  new Skill('counter', 'Counter Attack', '🛡️', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [HeritageRoute.KNIGHT], makeEffect(EffectType.COUNTER, 0.5), TriggerCondition.ON_HIT,
    '피격 시 받은 피해의 50%를 반격'),

  new Skill('iron_shield', 'Iron Shield', '🔰', SkillGrade.NORMAL, SkillCategory.SURVIVAL,
    [], makeEffect(EffectType.SHIELD, 0.3), TriggerCondition.PASSIVE,
    '최대 체력의 30%만큼 방어막 생성'),

  new Skill('multi_hit_mastery', 'Multi-Hit Mastery', '💫', SkillGrade.LEGENDARY, SkillCategory.MASTERY,
    [HeritageRoute.SKULL], makeEffect(EffectType.MULTI_HIT, 0.5), TriggerCondition.PASSIVE,
    '공격 시 50% 확률로 추가 타격'),

  new Skill('crit_mastery', 'Critical Mastery', '🎯', SkillGrade.LEGENDARY, SkillCategory.MASTERY,
    [HeritageRoute.RANGER], makeEffect(EffectType.BUFF, 0.15, 99, StatusEffectType.CRIT_UP), TriggerCondition.PASSIVE,
    '치명타 확률 15% 증가'),

  new Skill('rage_mastery', 'Rage Mastery', '💢', SkillGrade.LEGENDARY, SkillCategory.MASTERY,
    [HeritageRoute.SKULL, HeritageRoute.KNIGHT], makeEffect(EffectType.RAGE_POWER, 1.0), TriggerCondition.PASSIVE,
    '분노 공격 데미지 100% 증가'),

  new Skill('complete_rage_mastery', 'Complete Rage Mastery', '🔥', SkillGrade.LEGENDARY, SkillCategory.MASTERY,
    [HeritageRoute.SKULL, HeritageRoute.KNIGHT], makeEffect(EffectType.RAGE_BOOST, 25), TriggerCondition.PASSIVE,
    '분노 게이지 충전량 2배'),

  new Skill('rage_lightning', 'Rage Lightning', '⚡', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [HeritageRoute.GHOST], makeEffect(EffectType.DAMAGE, 30), TriggerCondition.ON_RAGE,
    '분노 공격 시 번개로 30의 추가 피해'),

  new Skill('rage_lance', 'Rage Lance', '🔱', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [HeritageRoute.KNIGHT], makeEffect(EffectType.DAMAGE, 35), TriggerCondition.ON_RAGE,
    '분노 공격 시 광창으로 35의 추가 피해'),

  new Skill('rage_flame_wave', 'Rage Flame Wave', '🔥', SkillGrade.NORMAL, SkillCategory.ATTACK,
    [], makeEffect(EffectType.DAMAGE, 25), TriggerCondition.ON_RAGE,
    '분노 공격 시 화염파로 25의 추가 피해'),

  new Skill('shrink_magic', 'Shrink Magic', '🔮', SkillGrade.LEGENDARY, SkillCategory.DEBUFF,
    [], makeEffect(EffectType.DEBUFF, 0.2, 3, StatusEffectType.ATK_DOWN), TriggerCondition.TURN_START,
    '턴 시작 시 적 공격력 20% 감소 (3턴)'),

  new Skill('hp_proficiency', 'HP Proficiency', '❤️', SkillGrade.LEGENDARY, SkillCategory.PROFICIENCY,
    [], makeEffect(EffectType.BUFF, 0.1, 99, StatusEffectType.DEF_UP), TriggerCondition.PASSIVE,
    '방어력 10% 증가'),

  new Skill('atk_proficiency', 'ATK Proficiency', '🗡️', SkillGrade.LEGENDARY, SkillCategory.PROFICIENCY,
    [], makeEffect(EffectType.BUFF, 0.1, 99, StatusEffectType.ATK_UP), TriggerCondition.PASSIVE,
    '공격력 10% 증가'),

  new Skill('def_proficiency', 'DEF Proficiency', '🏛️', SkillGrade.LEGENDARY, SkillCategory.PROFICIENCY,
    [], makeEffect(EffectType.BUFF, 0.1, 99, StatusEffectType.DEF_UP), TriggerCondition.PASSIVE,
    '방어력 10% 증가'),

  new Skill('crit_proficiency', 'CRIT Proficiency', '👁️', SkillGrade.LEGENDARY, SkillCategory.PROFICIENCY,
    [], makeEffect(EffectType.BUFF, 0.1, 99, StatusEffectType.CRIT_UP), TriggerCondition.PASSIVE,
    '치명타 확률 10% 증가'),

  new Skill('defense_ultimate', 'Defense Ultimate', '🏰', SkillGrade.MYTHIC, SkillCategory.SURVIVAL,
    [], makeEffect(EffectType.BUFF, 0.5, 99, StatusEffectType.DEF_UP), TriggerCondition.PASSIVE,
    '방어력 50% 증가'),

  new Skill('valor_ultimate', 'Valor Ultimate', '👑', SkillGrade.MYTHIC, SkillCategory.BUFF,
    [], makeEffect(EffectType.BUFF, 0.5, 99, StatusEffectType.ATK_UP), TriggerCondition.PASSIVE,
    '공격력 50% 증가'),

  new Skill('revive', 'Revive', '✨', SkillGrade.MYTHIC, SkillCategory.SURVIVAL,
    [], makeEffect(EffectType.REVIVE, 0.3), TriggerCondition.ON_DEATH,
    '사망 시 최대 체력의 30%로 부활 (1회)'),

  new Skill('super_atk', 'Super ATK', '💥', SkillGrade.MYTHIC, SkillCategory.BUFF,
    [], makeEffect(EffectType.BUFF, 0.8, 99, StatusEffectType.ATK_UP), TriggerCondition.PASSIVE,
    '공격력 80% 증가'),

  new Skill('thunderstorm', 'Thunderstorm', '⛈️', SkillGrade.MYTHIC, SkillCategory.ATTACK,
    [HeritageRoute.GHOST], makeEffect(EffectType.DAMAGE, 40), TriggerCondition.TURN_START,
    '턴 시작 시 뇌우로 40의 피해'),

  new Skill('tyrant', 'Tyrant', '👹', SkillGrade.MYTHIC, SkillCategory.ATTACK,
    [HeritageRoute.SKULL], makeEffect(EffectType.DAMAGE, 35), TriggerCondition.ON_ATTACK,
    '공격 시 폭군의 일격으로 35의 추가 피해'),

  new Skill('angel_power', 'Angel Power', '😇', SkillGrade.IMMORTAL, SkillCategory.BUFF,
    [], makeEffect(EffectType.BUFF, 1.0, 99, StatusEffectType.ATK_UP), TriggerCondition.PASSIVE,
    '공격력 100% 증가'),

  new Skill('demon_power', 'Demon Power', '😈', SkillGrade.IMMORTAL, SkillCategory.ATTACK,
    [], makeEffect(EffectType.DAMAGE, 60), TriggerCondition.ON_ATTACK,
    '공격 시 마왕의 힘으로 60의 추가 피해'),
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
