import { ResourceType, DungeonType } from '../enums';
import data from './json/resource-labels.data.json';

const RESOURCE_LABELS = data.labels as Record<ResourceType, string>;
const RESOURCE_SHORT_LABELS = data.shortLabels as Record<ResourceType, string>;
const RESOURCE_COLORS = data.colors as Partial<Record<ResourceType, string>>;
const DUNGEON_LABELS = data.dungeonLabels as Record<DungeonType, string>;

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
