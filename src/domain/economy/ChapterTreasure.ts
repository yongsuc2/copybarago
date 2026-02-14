import { Player } from '../entities/Player';
import { ChapterTreasureTable, type ChapterMilestone } from '../data/ChapterTreasureTable';
import { Result } from '../value-objects/Result';

export class ChapterTreasure {
  canClaim(milestone: ChapterMilestone, player: Player): boolean {
    if (player.claimedMilestones.has(milestone.id)) return false;
    const bestDay = player.bestSurvivalDays.get(milestone.chapterId) ?? 0;

    if (milestone.type === 'CLEAR') {
      return bestDay >= ChapterTreasureTable.getClearSentinelDay(milestone.chapterId);
    }

    return bestDay >= milestone.requiredDay;
  }

  claim(milestone: ChapterMilestone, player: Player): Result {
    if (player.claimedMilestones.has(milestone.id)) {
      return Result.fail('이미 수령한 보상입니다');
    }

    if (!this.canClaim(milestone, player)) {
      return Result.fail('수령 조건을 만족하지 않습니다');
    }

    player.claimedMilestones.add(milestone.id);

    for (const resource of milestone.reward.resources) {
      player.resources.add(resource.type, resource.amount);
    }

    return Result.ok();
  }

  getMilestoneStatus(milestone: ChapterMilestone, player: Player): 'locked' | 'claimable' | 'claimed' {
    if (player.claimedMilestones.has(milestone.id)) return 'claimed';
    if (this.canClaim(milestone, player)) return 'claimable';
    return 'locked';
  }
}
