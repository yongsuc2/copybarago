import { BattleUnit } from '../battle/BattleUnit';
import { Battle } from '../battle/Battle';
import { BattleState, ResourceType } from '../enums';
import { Reward } from '../value-objects/Reward';
import { EnemyTemplate } from '../chapter/EnemyTemplate';
import { EnemyTable } from '../data/EnemyTable';

export class CatacombDungeon {
  highestFloor: number;
  currentRunFloor: number;
  currentBattleIndex: number;
  readonly battlesPerFloor: number = 5;
  isRunning: boolean;

  constructor(highestFloor: number = 1) {
    this.highestFloor = highestFloor;
    this.currentRunFloor = highestFloor;
    this.currentBattleIndex = 0;
    this.isRunning = false;
  }

  startRun(): void {
    this.currentRunFloor = this.highestFloor;
    this.currentBattleIndex = 0;
    this.isRunning = true;
  }

  getNextBattle(playerUnit: BattleUnit): Battle | null {
    if (!this.isRunning) return null;

    const isBoss = this.currentBattleIndex >= this.battlesPerFloor;
    const enemyId = isBoss ? EnemyTable.getRandomBossId() : EnemyTable.getRandomEnemyId();
    const template = EnemyTemplate.fromId(enemyId);
    if (!template) return null;

    const scalingFloor = this.currentRunFloor + Math.floor(this.currentBattleIndex / 2);
    const enemy = template.createTowerInstance(scalingFloor);

    return new Battle(playerUnit, enemy, Date.now());
  }

  onBattleResult(state: BattleState): { continueRun: boolean; reward: Reward } {
    if (state === BattleState.DEFEAT) {
      this.isRunning = false;
      return { continueRun: false, reward: this.getFloorReward() };
    }

    this.currentBattleIndex += 1;

    if (this.currentBattleIndex > this.battlesPerFloor) {
      this.currentRunFloor += 1;
      if (this.currentRunFloor > this.highestFloor) {
        this.highestFloor = this.currentRunFloor;
      }
      this.currentBattleIndex = 0;
    }

    return { continueRun: true, reward: Reward.empty() };
  }

  endRun(): Reward {
    this.isRunning = false;
    return this.getFloorReward();
  }

  private getFloorReward(): Reward {
    const floorsCleared = this.currentRunFloor - this.highestFloor + 1;
    return Reward.fromResources(
      { type: ResourceType.GOLD, amount: Math.max(0, floorsCleared) * 100 },
      { type: ResourceType.EQUIPMENT_STONE, amount: Math.max(1, floorsCleared) },
    );
  }
}
