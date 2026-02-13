import { ResourceType } from '../enums';
import { Reward } from '../value-objects/Reward';
import { Travel } from '../content/Travel';

const MAX_OFFLINE_HOURS = 12;
const STAMINA_PER_HOUR = 60;

export class OfflineRewardCalculator {
  calculate(lastOnlineTimestamp: number, travel: Travel): Reward {
    const now = Date.now();
    const elapsedMs = now - lastOnlineTimestamp;
    const elapsedHours = Math.min(elapsedMs / (1000 * 60 * 60), MAX_OFFLINE_HOURS);

    if (elapsedHours < 0.05) {
      return Reward.empty();
    }

    const staminaUsed = Math.floor(elapsedHours * STAMINA_PER_HOUR);
    const goldEarned = travel.calculateGold(staminaUsed);

    return Reward.fromResources(
      { type: ResourceType.GOLD, amount: goldEarned },
      { type: ResourceType.STAMINA, amount: Math.floor(elapsedHours * 10) },
    );
  }

  getMaxOfflineHours(): number {
    return MAX_OFFLINE_HOURS;
  }

  previewReward(hours: number, travel: Travel): Reward {
    const clamped = Math.min(hours, MAX_OFFLINE_HOURS);
    const staminaUsed = Math.floor(clamped * STAMINA_PER_HOUR);
    const goldEarned = travel.calculateGold(staminaUsed);

    return Reward.fromResources(
      { type: ResourceType.GOLD, amount: goldEarned },
    );
  }
}
