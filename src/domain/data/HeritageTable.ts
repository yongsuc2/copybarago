import { HeritageRoute, ResourceType } from '../enums';
import { Stats } from '../value-objects/Stats';
import data from './json/heritage.data.json';

const BOOK_TYPE_MAP = data.bookTypeMap as Record<HeritageRoute, ResourceType>;

const PASSIVE_PER_LEVEL: Record<HeritageRoute, Stats> = {} as Record<HeritageRoute, Stats>;
for (const [route, raw] of Object.entries(data.passivePerLevel)) {
  PASSIVE_PER_LEVEL[route as HeritageRoute] = Stats.create(raw);
}

export const HeritageTable = {
  getBookType(route: HeritageRoute): ResourceType {
    return BOOK_TYPE_MAP[route];
  },

  getUpgradeCost(level: number): number {
    return data.baseUpgradeCost + level * data.costGrowth;
  },

  getPassivePerLevel(route: HeritageRoute): Stats {
    return PASSIVE_PER_LEVEL[route];
  },

  getSkillMultiplier(_route: HeritageRoute, level: number, isSynergy: boolean): number {
    if (!isSynergy) return data.baseSkillMultiplier;
    return data.baseSkillMultiplier + level * data.synergyMultiplierPerLevel;
  },
};
