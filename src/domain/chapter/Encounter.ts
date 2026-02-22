import { EncounterType } from '../enums';
import type { SessionSkill } from '../battle/BattleUnit';
import { Reward } from '../value-objects/Reward';

export interface EncounterOption {
  label: string;
  description: string;
  hpCostPercent: number;
  goldCost: number;
  successRate: number;
  reward: EncounterReward;
}

export interface EncounterReward {
  skills: SessionSkill[];
  healPercent: number;
  reward: Reward;
  skillIdsToRemove: string[];
}

export interface EncounterResult {
  chosen: EncounterOption;
  success: boolean;
  skillsGained: SessionSkill[];
  skillsRemoved: SessionSkill[];
  hpChange: number;
  goldChange: number;
  reward: Reward;
}

export class Encounter {
  constructor(
    public readonly type: EncounterType,
    public readonly options: EncounterOption[],
  ) {}

  resolve(choiceIndex: number, _currentHp: number, maxHp: number, _currentGold: number, roll: number): EncounterResult {
    const chosen = this.options[Math.min(choiceIndex, this.options.length - 1)];

    const success = roll <= chosen.successRate;
    const hpCost = Math.floor(maxHp * chosen.hpCostPercent);
    const goldCost = chosen.goldCost;

    if (!success) {
      return {
        chosen,
        success: false,
        skillsGained: [],
        skillsRemoved: [],
        hpChange: -hpCost,
        goldChange: -goldCost,
        reward: Reward.empty(),
      };
    }

    const healAmount = Math.floor(maxHp * chosen.reward.healPercent);

    return {
      chosen,
      success: true,
      skillsGained: chosen.reward.skills,
      skillsRemoved: [],
      hpChange: healAmount - hpCost,
      goldChange: -goldCost,
      reward: chosen.reward.reward,
    };
  }
}
