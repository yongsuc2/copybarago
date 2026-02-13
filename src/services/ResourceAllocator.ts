import { Player } from '../domain/entities/Player';
import { StatType, ResourceType } from '../domain/enums';

export interface GoldAllocationPlan {
  atkAmount: number;
  hpAmount: number;
  defAmount: number;
  heritageAmount: number;
}

export class ResourceAllocator {
  allocateGold(player: Player): GoldAllocationPlan {
    const totalGold = player.resources.gold;
    const talent = player.talent;

    const atkDeficit = Math.max(0, talent.hpLevel - talent.atkLevel);
    const hpDeficit = Math.max(0, talent.atkLevel - talent.hpLevel - 5);

    let atkRatio = 0.6;
    let hpRatio = 0.3;
    const defRatio = 0.05;
    let heritageRatio = 0.05;

    if (atkDeficit > 3) {
      atkRatio = 0.7;
      hpRatio = 0.2;
    }
    if (hpDeficit > 3) {
      hpRatio = 0.5;
      atkRatio = 0.4;
    }

    if (player.isHeritageUnlocked()) {
      heritageRatio = 0.1;
      atkRatio -= 0.05;
    }

    return {
      atkAmount: Math.floor(totalGold * atkRatio),
      hpAmount: Math.floor(totalGold * hpRatio),
      defAmount: Math.floor(totalGold * defRatio),
      heritageAmount: Math.floor(totalGold * heritageRatio),
    };
  }

  shouldSpendGems(player: Player, purpose: 'gacha' | 'arena_retry' | 'stamina'): boolean {
    const gems = player.resources.gems;
    const pityTarget = 180 * 298;

    switch (purpose) {
      case 'gacha':
        return gems >= 2980;
      case 'arena_retry':
        return gems > pityTarget && gems >= 50;
      case 'stamina':
        return false;
      default:
        return false;
    }
  }

  autoUpgradeTalent(player: Player): { upgraded: boolean; stat: StatType; cost: number }[] {
    const plan = this.allocateGold(player);
    const results: { upgraded: boolean; stat: StatType; cost: number }[] = [];

    const allocations: [StatType, number][] = [
      [StatType.ATK, plan.atkAmount],
      [StatType.HP, plan.hpAmount],
      [StatType.DEF, plan.defAmount],
    ];

    for (const [stat, budget] of allocations) {
      let spent = 0;
      while (true) {
        const cost = player.talent.getUpgradeCost(stat);
        if (spent + cost > budget) break;
        if (player.resources.gold < cost) break;

        const result = player.talent.upgrade(stat, player.resources.gold);
        if (result.isFail()) break;

        player.resources.spend(ResourceType.GOLD, result.data!.cost);
        spent += result.data!.cost;
        results.push({ upgraded: true, stat, cost: result.data!.cost });
      }
    }

    return results;
  }
}
