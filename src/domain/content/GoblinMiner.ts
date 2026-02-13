import { ResourceType } from '../enums';
import { Reward } from '../value-objects/Reward';
import { Result } from '../value-objects/Result';
import { SeededRandom } from '../../infrastructure/SeededRandom';

const ORE_PER_MINE = 1;
const CART_THRESHOLD = 30;

export class GoblinMiner {
  oreCount: number;

  constructor(oreCount: number = 0) {
    this.oreCount = oreCount;
  }

  mine(pickaxeCount: number): Result<{ oreGained: number }> {
    if (pickaxeCount < 1) {
      return Result.fail('No pickaxes');
    }

    this.oreCount += ORE_PER_MINE;
    return Result.ok({ oreGained: ORE_PER_MINE });
  }

  canUseCart(): boolean {
    return this.oreCount >= CART_THRESHOLD;
  }

  useCart(rng: SeededRandom): Result<{ reward: Reward }> {
    if (!this.canUseCart()) {
      return Result.fail(`Need ${CART_THRESHOLD} ore (have ${this.oreCount})`);
    }

    this.oreCount -= CART_THRESHOLD;

    const goldReward = rng.nextInt(200, 500);
    const stoneReward = rng.nextInt(1, 3);
    const reward = Reward.fromResources(
      { type: ResourceType.GOLD, amount: goldReward },
      { type: ResourceType.EQUIPMENT_STONE, amount: stoneReward },
    );

    return Result.ok({ reward });
  }

  getProgress(): number {
    return Math.min(1, this.oreCount / CART_THRESHOLD);
  }

  getOreNeeded(): number {
    return Math.max(0, CART_THRESHOLD - this.oreCount);
  }
}
