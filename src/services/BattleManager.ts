import { Battle } from '../domain/battle/Battle';
import { BattleUnit } from '../domain/battle/BattleUnit';
import { BattleState } from '../domain/enums';
import { Stats } from '../domain/value-objects/Stats';
import { Reward } from '../domain/value-objects/Reward';
import { ResourceType } from '../domain/enums';
import { Player } from '../domain/entities/Player';
import type { ActiveSkill } from '../domain/entities/ActiveSkill';
import type { PassiveSkill } from '../domain/entities/PassiveSkill';

export interface BattleResult {
  state: BattleState;
  turns: number;
  playerHpRemaining: number;
  reward: Reward;
}

export class BattleManager {
  createPlayerUnit(player: Player, activeSkills: ActiveSkill[], passiveSkills: PassiveSkill[]): BattleUnit {
    const stats = player.computeStats();
    return new BattleUnit('Capybara', stats, [...activeSkills], [...passiveSkills], true);
  }

  createBattle(playerUnit: BattleUnit, enemyUnit: BattleUnit, seed?: number): Battle {
    return new Battle(playerUnit, enemyUnit, seed);
  }

  simulateBattle(battle: Battle, maxTurns: number = 100): BattleResult {
    battle.runToCompletion(maxTurns);

    const reward = battle.state === BattleState.VICTORY
      ? this.generateCombatReward(battle.turnCount)
      : Reward.empty();

    return {
      state: battle.state,
      turns: battle.turnCount,
      playerHpRemaining: battle.player.currentHp,
      reward,
    };
  }

  private generateCombatReward(turns: number): Reward {
    const goldAmount = 50 + turns * 5;
    return Reward.fromResources(
      { type: ResourceType.GOLD, amount: goldAmount },
    );
  }

  calculateDamagePreview(atk: number, def: number): number {
    return Math.max(1, atk - Math.floor(def * 0.5));
  }

  estimateSurvivalTurns(playerStats: Stats, enemyStats: Stats): number {
    const enemyDamagePerTurn = Math.max(1, enemyStats.atk - Math.floor(playerStats.def * 0.5));
    return Math.ceil(playerStats.hp / enemyDamagePerTurn);
  }

  estimateKillTurns(playerStats: Stats, enemyStats: Stats): number {
    const playerDamagePerTurn = Math.max(1, playerStats.atk - Math.floor(enemyStats.def * 0.5));
    return Math.ceil(enemyStats.hp / playerDamagePerTurn);
  }
}
