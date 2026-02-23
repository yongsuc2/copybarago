import { Battle } from '../domain/battle/Battle';
import { BattleUnit } from '../domain/battle/BattleUnit';
import { BattleState, PassiveType } from '../domain/enums';
import { Stats } from '../domain/value-objects/Stats';
import { Reward } from '../domain/value-objects/Reward';
import { ResourceType } from '../domain/enums';
import { Player } from '../domain/entities/Player';
import type { ActiveSkill } from '../domain/entities/ActiveSkill';
import { PassiveSkill } from '../domain/entities/PassiveSkill';
import { PetTable } from '../domain/data/PetTable';
import type { PetAbilityDef } from '../domain/data/PetTable';

export interface BattleResult {
  state: BattleState;
  turns: number;
  playerHpRemaining: number;
  reward: Reward;
}

export class BattleManager {
  getPetAbilitySkill(player: Player): PassiveSkill | null {
    const pet = player.activePet;
    if (!pet) return null;
    const template = PetTable.getTemplate(pet.id.replace(/^attendance_pet_.*/, ''));
    const templateByName = template ?? PetTable.getAllTemplates().find(t => t.name === pet.name);
    if (!templateByName) return null;

    const ab = templateByName.ability;
    const val = PetTable.getAbilityValue(ab, pet.grade);
    const desc = PetTable.getAbilityDescription(templateByName.id, pet.grade);
    return this.abilityToPassiveSkill(ab, val, `pet_ability_${pet.id}`, desc);
  }

  private abilityToPassiveSkill(ab: PetAbilityDef, value: number, id: string, desc: string): PassiveSkill | null {
    switch (ab.passiveType) {
      case PassiveType.STAT_MODIFIER:
        return new PassiveSkill(id, desc, '', 1, [], [], {
          type: PassiveType.STAT_MODIFIER, stat: ab.stat!, value, isPercentage: ab.isPercentage,
        });
      case PassiveType.COUNTER:
        return new PassiveSkill(id, desc, '', 1, [], [], {
          type: PassiveType.COUNTER, triggerChance: value,
        });
      case PassiveType.LIFESTEAL:
        return new PassiveSkill(id, desc, '', 1, [], [], {
          type: PassiveType.LIFESTEAL, rate: value,
        });
      case PassiveType.SHIELD_ON_START:
        return new PassiveSkill(id, desc, '', 1, [], [], {
          type: PassiveType.SHIELD_ON_START, hpPercent: value,
        });
      case PassiveType.REVIVE:
        return new PassiveSkill(id, desc, '', 1, [], [], {
          type: PassiveType.REVIVE, hpPercent: value, maxUses: 1,
        });
      case PassiveType.REGEN:
        return new PassiveSkill(id, desc, '', 1, [], [], {
          type: PassiveType.REGEN, healPerTurn: value,
        });
      case PassiveType.MULTI_HIT:
        return new PassiveSkill(id, desc, '', 1, [], [], {
          type: PassiveType.MULTI_HIT, chance: value,
        });
      default:
        return null;
    }
  }

  createPlayerUnit(player: Player, activeSkills: ActiveSkill[], passiveSkills: PassiveSkill[]): BattleUnit {
    const stats = player.computeStats();
    const petAbility = this.getPetAbilitySkill(player);
    const allPassives = [...passiveSkills];
    if (petAbility) allPassives.push(petAbility);
    return new BattleUnit('Capybara', stats, [...activeSkills], allPassives, true);
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
