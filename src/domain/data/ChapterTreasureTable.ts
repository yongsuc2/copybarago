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

function getChapterType(chapterId: number): ChapterType {
  if (chapterId <= 3) return ChapterType.FIVE_DAY;
  if (chapterId % 2 === 0) return ChapterType.THIRTY_DAY;
  return ChapterType.SIXTY_DAY;
}

function getTotalDays(type: ChapterType): number {
  switch (type) {
    case ChapterType.SIXTY_DAY: return 60;
    case ChapterType.THIRTY_DAY: return 30;
    case ChapterType.FIVE_DAY: return 5;
  }
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
    const type = getChapterType(chapterId);

    if (type === ChapterType.FIVE_DAY) {
      return [
        makeClearMilestone(chapterId, 200, 50, 2, 0),
      ];
    }

    if (type === ChapterType.THIRTY_DAY) {
      return [
        makeSurviveMilestone(chapterId, 10, 300, 30, 3, 0),
        makeSurviveMilestone(chapterId, 20, 500, 50, 5, 1),
        makeClearMilestone(chapterId, 800, 100, 8, 2),
      ];
    }

    return [
      makeSurviveMilestone(chapterId, 15, 300, 30, 3, 0),
      makeSurviveMilestone(chapterId, 25, 500, 60, 5, 1),
      makeSurviveMilestone(chapterId, 40, 800, 100, 8, 2),
      makeClearMilestone(chapterId, 1200, 150, 12, 3),
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
