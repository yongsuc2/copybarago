export enum StatType {
  HP = 'HP',
  ATK = 'ATK',
  DEF = 'DEF',
  CRIT = 'CRIT',
}

export enum TalentGrade {
  DISCIPLE = 'DISCIPLE',
  ADVENTURER = 'ADVENTURER',
  ELITE = 'ELITE',
  MASTER = 'MASTER',
  WARRIOR = 'WARRIOR',
  HERO = 'HERO',
}

export enum HeritageRoute {
  SKULL = 'SKULL',
  KNIGHT = 'KNIGHT',
  RANGER = 'RANGER',
  GHOST = 'GHOST',
}

export enum SkillGrade {
  NORMAL = 'NORMAL',
  LEGENDARY = 'LEGENDARY',
  MYTHIC = 'MYTHIC',
  IMMORTAL = 'IMMORTAL',
}

export enum SkillCategory {
  ATTACK = 'ATTACK',
  MASTERY = 'MASTERY',
  SURVIVAL = 'SURVIVAL',
  DEBUFF = 'DEBUFF',
  BUFF = 'BUFF',
}

export enum EquipmentGrade {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  MYTHIC = 'MYTHIC',
}

export enum SlotType {
  WEAPON = 'WEAPON',
  ARMOR = 'ARMOR',
  RING = 'RING',
  NECKLACE = 'NECKLACE',
  SHOES = 'SHOES',
  GLOVES = 'GLOVES',
  HAT = 'HAT',
}

export enum WeaponSubType {
  SWORD = 'SWORD',
  STAFF = 'STAFF',
  BOW = 'BOW',
}

export enum PetTier {
  S = 'S',
  A = 'A',
  B = 'B',
}

export enum PetGrade {
  COMMON = 'COMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  IMMORTAL = 'IMMORTAL',
}

export enum EncounterType {
  DEMON = 'DEMON',
  CHANCE = 'CHANCE',
  COMBAT = 'COMBAT',
  JUNGBAK_ROULETTE = 'JUNGBAK_ROULETTE',
  DAEBAK_ROULETTE = 'DAEBAK_ROULETTE',
}

export enum ChapterType {
  SIXTY_DAY = 'SIXTY_DAY',
  THIRTY_DAY = 'THIRTY_DAY',
  FIVE_DAY = 'FIVE_DAY',
}

export enum DungeonType {
  DRAGON_NEST = 'DRAGON_NEST',
  CELESTIAL_TREE = 'CELESTIAL_TREE',
  SKY_ISLAND = 'SKY_ISLAND',
}

export enum ArenaTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
  MASTER = 'MASTER',
}

export enum ChestType {
  EQUIPMENT = 'EQUIPMENT',
  PET = 'PET',
  GEM = 'GEM',
}

export enum EffectType {
  DAMAGE = 'DAMAGE',
  HEAL = 'HEAL',
  BUFF = 'BUFF',
  DEBUFF = 'DEBUFF',
  DOT = 'DOT',
  HOT = 'HOT',
  REVIVE = 'REVIVE',
  LIFESTEAL = 'LIFESTEAL',
  COUNTER = 'COUNTER',
  MULTI_HIT = 'MULTI_HIT',
  RAGE_POWER = 'RAGE_POWER',
  RAGE_BOOST = 'RAGE_BOOST',
  SHIELD = 'SHIELD',
  AOE_DAMAGE = 'AOE_DAMAGE',
  MAGIC_BOOST = 'MAGIC_BOOST',
}

export enum TriggerCondition {
  TURN_START = 'TURN_START',
  ON_ATTACK = 'ON_ATTACK',
  ON_HIT = 'ON_HIT',
  PASSIVE = 'PASSIVE',
  ON_DEATH = 'ON_DEATH',
  ON_RAGE = 'ON_RAGE',
}

export enum StatusEffectType {
  POISON = 'POISON',
  BURN = 'BURN',
  REGEN = 'REGEN',
  ATK_UP = 'ATK_UP',
  ATK_DOWN = 'ATK_DOWN',
  DEF_UP = 'DEF_UP',
  DEF_DOWN = 'DEF_DOWN',
  CRIT_UP = 'CRIT_UP',
}

export enum BattleState {
  IN_PROGRESS = 'IN_PROGRESS',
  VICTORY = 'VICTORY',
  DEFEAT = 'DEFEAT',
}

export enum ResourceType {
  GOLD = 'GOLD',
  GEMS = 'GEMS',
  STAMINA = 'STAMINA',
  CHALLENGE_TOKEN = 'CHALLENGE_TOKEN',
  ARENA_TICKET = 'ARENA_TICKET',
  PICKAXE = 'PICKAXE',
  EQUIPMENT_STONE = 'EQUIPMENT_STONE',
  POWER_STONE = 'POWER_STONE',
  SKULL_BOOK = 'SKULL_BOOK',
  KNIGHT_BOOK = 'KNIGHT_BOOK',
  RANGER_BOOK = 'RANGER_BOOK',
  GHOST_BOOK = 'GHOST_BOOK',
  PET_EGG = 'PET_EGG',
  PET_FOOD = 'PET_FOOD',
}

export enum SkillHierarchy {
  BUILTIN = 'BUILTIN',
  UPPER = 'UPPER',
  LOWER = 'LOWER',
  LOWEST = 'LOWEST',
}

export enum AttackType {
  PHYSICAL = 'PHYSICAL',
  MAGIC = 'MAGIC',
  FIXED = 'FIXED',
}

export enum SkillEffectType {
  ATTACK = 'ATTACK',
  TRIGGER_SKILL = 'TRIGGER_SKILL',
  INJECT_EFFECT = 'INJECT_EFFECT',
  HEAL_HP = 'HEAL_HP',
  ADD_RAGE = 'ADD_RAGE',
  CONSUME_RAGE = 'CONSUME_RAGE',
  DEBUFF = 'DEBUFF',
}

export enum SpecialConditionType {
  NONE = 'NONE',
  RAGE_FULL = 'RAGE_FULL',
  HP_BELOW = 'HP_BELOW',
  HP_ABOVE = 'HP_ABOVE',
  HP_BELOW_ONCE = 'HP_BELOW_ONCE',
}

export enum SkillTag {
  SHURIKEN = 'SHURIKEN',
  LIGHTNING = 'LIGHTNING',
  RAGE = 'RAGE',
  HP_RECOVERY = 'HP_RECOVERY',
  POISON = 'POISON',
  PHYSICAL = 'PHYSICAL',
  MAGIC = 'MAGIC',
  LANCE = 'LANCE',
  SWORD_AURA = 'SWORD_AURA',
  FLAME = 'FLAME',
  DEBUFF = 'DEBUFF',
  NORMAL_ATTACK = 'NORMAL_ATTACK',
}

export enum PassiveType {
  STAT_MODIFIER = 'STAT_MODIFIER',
  COUNTER = 'COUNTER',
  LIFESTEAL = 'LIFESTEAL',
  SHIELD_ON_START = 'SHIELD_ON_START',
  REVIVE = 'REVIVE',
  REGEN = 'REGEN',
  MULTI_HIT = 'MULTI_HIT',
  SKILL_MODIFIER = 'SKILL_MODIFIER',
  LOW_HP_MODIFIER = 'LOW_HP_MODIFIER',
}
