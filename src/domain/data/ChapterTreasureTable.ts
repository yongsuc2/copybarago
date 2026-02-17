import { ChapterType, ResourceType } from '../enums';
import { Reward, type ResourceReward } from '../value-objects/Reward';

export interface ChapterMilestone {
  id: string;
  chapterId: number;
  type: 'CLEAR' | 'SURVIVE';
  requiredDay: number;
  label: string;
  reward: Reward;
}

function getChapterType(_chapterId: number): ChapterType {
  return ChapterType.SIXTY_DAY;
}

function getTotalDays(_type: ChapterType): number {
  return 60;
}

function buildReward(id: number, gold: number, gems: number, eqStone: number, pwStone: number): Reward {
  const resources: ResourceReward[] = [];
  if (gold > 0) resources.push({ type: ResourceType.GOLD, amount: gold * id });
  if (gems > 0) resources.push({ type: ResourceType.GEMS, amount: gems });
  if (eqStone > 0) resources.push({ type: ResourceType.EQUIPMENT_STONE, amount: eqStone });
  if (pwStone > 0) resources.push({ type: ResourceType.POWER_STONE, amount: pwStone });
  return Reward.fromResources(...resources);
}

function makeSurviveMilestone(chapterId: number, day: number, gold: number, gems: number, eqStone: number, pwStone: number): ChapterMilestone {
  return {
    id: `ch${chapterId}_d${day}`,
    chapterId,
    type: 'SURVIVE',
    requiredDay: day,
    label: `${day}일`,
    reward: buildReward(chapterId, gold, gems, eqStone, pwStone),
  };
}

function makeClearMilestone(chapterId: number, gold: number, gems: number, eqStone: number, pwStone: number): ChapterMilestone {
  return {
    id: `ch${chapterId}_clear`,
    chapterId,
    type: 'CLEAR',
    requiredDay: 0,
    label: '챕터 클리어',
    reward: buildReward(chapterId, gold, gems, eqStone, pwStone),
  };
}

export const ChapterTreasureTable = {
  getChapterType,

  getTotalDays(chapterId: number): number {
    return getTotalDays(getChapterType(chapterId));
  },

  getClearSentinelDay(chapterId: number): number {
    return getTotalDays(getChapterType(chapterId)) + 1;
  },

  getMilestonesForChapter(chapterId: number): ChapterMilestone[] {
    return [
      makeSurviveMilestone(chapterId, 15, 150, 10, 1, 0),
      makeSurviveMilestone(chapterId, 25, 250, 25, 3, 0),
      makeSurviveMilestone(chapterId, 40, 400, 40, 5, 1),
      makeClearMilestone(chapterId, 600, 60, 8, 2),
    ];
  },

  getMilestoneById(milestoneId: string): ChapterMilestone | null {
    const match = milestoneId.match(/^ch(\d+)_/);
    if (!match) return null;
    const chapterId = parseInt(match[1]);
    const milestones = this.getMilestonesForChapter(chapterId);
    return milestones.find(m => m.id === milestoneId) ?? null;
  },

  getAvailableChapterIds(clearedChapterMax: number): number[] {
    const ids: number[] = [];
    for (let i = 1; i <= clearedChapterMax + 1; i++) {
      ids.push(i);
    }
    return ids;
  },
};
