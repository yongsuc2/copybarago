import { HeritageRoute, ResourceType } from '../enums';
import { Stats } from '../value-objects/Stats';

const BOOK_TYPE_MAP: Record<HeritageRoute, ResourceType> = {
  [HeritageRoute.SKULL]: ResourceType.SKULL_BOOK,
  [HeritageRoute.KNIGHT]: ResourceType.KNIGHT_BOOK,
  [HeritageRoute.RANGER]: ResourceType.RANGER_BOOK,
  [HeritageRoute.GHOST]: ResourceType.GHOST_BOOK,
};

const BASE_UPGRADE_COST = 1;
const COST_GROWTH = 1;

const PASSIVE_PER_LEVEL: Record<HeritageRoute, Stats> = {
  [HeritageRoute.SKULL]: Stats.create({ atk: 3 }),
  [HeritageRoute.KNIGHT]: Stats.create({ def: 2, maxHp: 10 }),
  [HeritageRoute.RANGER]: Stats.create({ atk: 2, crit: 0.005 }),
  [HeritageRoute.GHOST]: Stats.create({ atk: 1, maxHp: 5 }),
};

const BASE_SKILL_MULTIPLIER = 1.0;
const SYNERGY_MULTIPLIER_PER_LEVEL = 0.02;

export const HeritageTable = {
  getBookType(route: HeritageRoute): ResourceType {
    return BOOK_TYPE_MAP[route];
  },

  getUpgradeCost(level: number): number {
    return BASE_UPGRADE_COST + level * COST_GROWTH;
  },

  getPassivePerLevel(route: HeritageRoute): Stats {
    return PASSIVE_PER_LEVEL[route];
  },

  getSkillMultiplier(_route: HeritageRoute, level: number, isSynergy: boolean): number {
    if (!isSynergy) return BASE_SKILL_MULTIPLIER;
    return BASE_SKILL_MULTIPLIER + level * SYNERGY_MULTIPLIER_PER_LEVEL;
  },
};
