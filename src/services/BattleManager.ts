import { Battle } from '../domain/battle/Battle';
import { BattleUnit } from '../domain/battle/BattleUnit';
import { BattleState, EffectType, PassiveType, StatType, StatusEffectType } from '../domain/enums';
import { Stats } from '../domain/value-objects/Stats';
import { Reward } from '../domain/value-objects/Reward';
import { ResourceType } from '../domain/enums';
import { Player } from '../domain/entities/Player';
import type { ActiveSkill } from '../domain/entities/ActiveSkill';
import { PassiveSkill } from '../domain/entities/PassiveSkill';
import type { EquipmentPassiveDef } from '../domain/data/EquipmentPassiveTable';

export interface BattleResult {
  state: BattleState;
  turns: number;
  playerHpRemaining: number;
  reward: Reward;
}

export class BattleManager {
  getEquipmentPassiveSkills(player: Player): PassiveSkill[] {
    const skills: PassiveSkill[] = [];
    for (const [, slot] of player.equipmentSlots.entries()) {
      for (const eq of slot.equipped) {
        if (!eq) continue;
        const passive = eq.getPassive();
        if (!passive) continue;
        const converted = this.passiveToPassiveSkill(passive, eq.id);
        if (converted) skills.push(converted);
      }
    }
    return skills;
  }

  private passiveToPassiveSkill(passive: EquipmentPassiveDef, eqId: string): PassiveSkill | null {
    const id = `eq_passive_${eqId}`;

    switch (passive.effectType) {
      case EffectType.BUFF: {
        let stat: StatType | 'RAGE_POWER';
        if (passive.statusEffectType === StatusEffectType.ATK_UP) stat = StatType.ATK;
        else if (passive.statusEffectType === StatusEffectType.DEF_UP) stat = StatType.DEF;
        else if (passive.statusEffectType === StatusEffectType.CRIT_UP) stat = StatType.CRIT;
        else return null;
        return new PassiveSkill(id, passive.description, passive.icon, 1, [], [], {
          type: PassiveType.STAT_MODIFIER, stat, value: passive.value, isPercentage: true,
        });
      }
      case EffectType.SHIELD:
        return new PassiveSkill(id, passive.description, passive.icon, 1, [], [], {
          type: PassiveType.SHIELD_ON_START, hpPercent: passive.value,
        });
      case EffectType.HOT:
        return new PassiveSkill(id, passive.description, passive.icon, 1, [], [], {
          type: PassiveType.REGEN, healPerTurn: passive.value,
        });
      case EffectType.MULTI_HIT:
        return new PassiveSkill(id, passive.description, passive.icon, 1, [], [], {
          type: PassiveType.MULTI_HIT, chance: passive.value,
        });
      case EffectType.RAGE_BOOST:
        return new PassiveSkill(id, passive.description, passive.icon, 1, [], [], {
          type: PassiveType.STAT_MODIFIER, stat: 'RAGE_POWER', value: passive.value, isPercentage: false,
        });
      default:
        return null;
    }
  }

  createPlayerUnit(player: Player, activeSkills: ActiveSkill[], passiveSkills: PassiveSkill[]): BattleUnit {
    const stats = player.computeStats();
    const equipPassives = this.getEquipmentPassiveSkills(player);
    return new BattleUnit('Capybara', stats, [...activeSkills], [...passiveSkills, ...equipPassives], true);
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
