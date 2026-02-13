import { BattleUnit } from '../battle/BattleUnit';
import { Battle } from '../battle/Battle';
import { BattleState, ResourceType } from '../enums';
import { Reward } from '../value-objects/Reward';
import { Result } from '../value-objects/Result';
import { EnemyTemplate } from '../chapter/EnemyTemplate';
import { EnemyTable } from '../data/EnemyTable';

export class Tower {
  currentFloor: number;
  currentStage: number;
  readonly maxFloor: number = 100;
  readonly stagesPerFloor: number = 10;

  constructor(currentFloor: number = 1, currentStage: number = 1) {
    this.currentFloor = currentFloor;
    this.currentStage = currentStage;
  }

  challenge(playerUnit: BattleUnit, challengeTokens: number): Result<{ battle: Battle }> {
    if (challengeTokens < 1) {
      return Result.fail('No challenge tokens');
    }

    const enemyId = this.currentStage === this.stagesPerFloor
      ? EnemyTable.getRandomBossId()
      : EnemyTable.getRandomEnemyId();

    const template = EnemyTemplate.fromId(enemyId);
    if (!template) return Result.fail('Enemy not found');

    const enemy = template.createTowerInstance(this.currentFloor);
    const battle = new Battle(playerUnit, enemy, Date.now());

    return Result.ok({ battle });
  }

  onBattleResult(state: BattleState): { advanced: boolean; reward: Reward; tokenConsumed: boolean } {
    if (state === BattleState.DEFEAT) {
      return { advanced: false, reward: Reward.empty(), tokenConsumed: false };
    }

    const reward = this.getReward(this.currentFloor, this.currentStage);

    if (this.currentStage >= this.stagesPerFloor) {
      this.currentStage = 1;
      this.currentFloor = Math.min(this.currentFloor + 1, this.maxFloor);
    } else {
      this.currentStage += 1;
    }

    return { advanced: true, reward, tokenConsumed: true };
  }

  getReward(floor: number, stage: number): Reward {
    const rewards: { type: ResourceType; amount: number }[] = [
      { type: ResourceType.GOLD, amount: 50 * floor },
    ];

    if (stage === 5 || stage === 10) {
      rewards.push({ type: ResourceType.POWER_STONE, amount: 1 });
    }

    if (stage === 10) {
      rewards.push({ type: ResourceType.EQUIPMENT_STONE, amount: 3 });
    }

    return Reward.fromResources(...rewards);
  }

  getProgress(): number {
    const totalStages = this.maxFloor * this.stagesPerFloor;
    const currentTotal = (this.currentFloor - 1) * this.stagesPerFloor + this.currentStage;
    return currentTotal / totalStages;
  }
}
