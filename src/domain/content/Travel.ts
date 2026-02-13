import { ResourceType } from '../enums';
import { Reward } from '../value-objects/Reward';
import { Result } from '../value-objects/Result';

const BASE_GOLD_PER_CHAPTER = 50;
const AVAILABLE_MULTIPLIERS = [3, 5, 10, 20, 50];

export class Travel {
  maxClearedChapter: number;
  multiplier: number;

  constructor(maxClearedChapter: number = 1) {
    this.maxClearedChapter = maxClearedChapter;
    this.multiplier = 3;
  }

  setMultiplier(mult: number): Result {
    if (!AVAILABLE_MULTIPLIERS.includes(mult)) {
      return Result.fail('Invalid multiplier');
    }
    this.multiplier = mult;
    return Result.ok();
  }

  getAvailableMultipliers(): number[] {
    return AVAILABLE_MULTIPLIERS;
  }

  run(staminaToSpend: number, availableStamina: number): Result<{ reward: Reward; staminaSpent: number }> {
    if (availableStamina < staminaToSpend || staminaToSpend <= 0) {
      return Result.fail('Not enough stamina');
    }

    const goldEarned = this.calculateGold(staminaToSpend);
    const reward = Reward.fromResources(
      { type: ResourceType.GOLD, amount: goldEarned },
    );

    return Result.ok({ reward, staminaSpent: staminaToSpend });
  }

  calculateGold(stamina: number): number {
    return Math.floor(stamina * BASE_GOLD_PER_CHAPTER * this.maxClearedChapter * this.multiplier / 100);
  }

  getGoldPreview(stamina: number): number {
    return this.calculateGold(stamina);
  }
}
