import { ResourceType, DungeonType } from '../enums';

const RESOURCE_LABELS: Record<ResourceType, string> = {
  [ResourceType.GOLD]: '골드',
  [ResourceType.GEMS]: '보석',
  [ResourceType.STAMINA]: '스태미나',
  [ResourceType.CHALLENGE_TOKEN]: '도전 토큰',
  [ResourceType.ARENA_TICKET]: '투기장 티켓',
  [ResourceType.PICKAXE]: '곡괭이',
  [ResourceType.EQUIPMENT_STONE]: '장비석',
  [ResourceType.POWER_STONE]: '파워스톤',
  [ResourceType.SKULL_BOOK]: '해골 서적',
  [ResourceType.KNIGHT_BOOK]: '기사 서적',
  [ResourceType.RANGER_BOOK]: '레인저 서적',
  [ResourceType.GHOST_BOOK]: '유령 서적',
  [ResourceType.PET_EGG]: '펫 알',
  [ResourceType.PET_FOOD]: '사료',
};

const RESOURCE_SHORT_LABELS: Record<ResourceType, string> = {
  [ResourceType.GOLD]: 'G',
  [ResourceType.GEMS]: '보석',
  [ResourceType.STAMINA]: '스태미나',
  [ResourceType.CHALLENGE_TOKEN]: '토큰',
  [ResourceType.ARENA_TICKET]: '티켓',
  [ResourceType.PICKAXE]: '곡괭이',
  [ResourceType.EQUIPMENT_STONE]: '장비석',
  [ResourceType.POWER_STONE]: '파워스톤',
  [ResourceType.SKULL_BOOK]: '해골 서적',
  [ResourceType.KNIGHT_BOOK]: '기사 서적',
  [ResourceType.RANGER_BOOK]: '레인저 서적',
  [ResourceType.GHOST_BOOK]: '유령 서적',
  [ResourceType.PET_EGG]: '펫 알',
  [ResourceType.PET_FOOD]: '사료',
};

const RESOURCE_COLORS: Partial<Record<ResourceType, string>> = {
  [ResourceType.GOLD]: '#ffd700',
  [ResourceType.GEMS]: '#e040fb',
  [ResourceType.EQUIPMENT_STONE]: '#4fc3f7',
  [ResourceType.POWER_STONE]: '#ff7043',
};

const DUNGEON_LABELS: Record<DungeonType, string> = {
  [DungeonType.DRAGON_NEST]: '용의 둥지',
  [DungeonType.CELESTIAL_TREE]: '세계수',
  [DungeonType.SKY_ISLAND]: '하늘섬',
};

export const ResourceDataTable = {
  getLabel(type: ResourceType): string {
    return RESOURCE_LABELS[type];
  },
  getShortLabel(type: ResourceType): string {
    return RESOURCE_SHORT_LABELS[type];
  },
  getColor(type: ResourceType): string {
    return RESOURCE_COLORS[type] ?? '#888';
  },
  getDungeonLabel(type: DungeonType): string {
    return DUNGEON_LABELS[type];
  },
  labels: RESOURCE_LABELS,
  shortLabels: RESOURCE_SHORT_LABELS,
  colors: RESOURCE_COLORS,
  dungeonLabels: DUNGEON_LABELS,
};
