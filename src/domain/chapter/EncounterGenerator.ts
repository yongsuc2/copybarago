import { EncounterType, ChapterType, ResourceType, SkillGrade } from '../enums';
import { Encounter } from './Encounter';
import type { EncounterOption, EncounterReward } from './Encounter';
import { Reward } from '../value-objects/Reward';
import { Skill } from '../entities/Skill';
import { SkillTable } from '../data/SkillTable';
import { SeededRandom } from '../../infrastructure/SeededRandom';

interface EncounterWeight {
  type: EncounterType;
  weight: number;
}

const ENCOUNTER_WEIGHTS: Record<ChapterType, EncounterWeight[]> = {
  [ChapterType.SIXTY_DAY]: [
    { type: EncounterType.COMBAT, weight: 35 },
    { type: EncounterType.ANGEL, weight: 20 },
    { type: EncounterType.DEMON, weight: 10 },
    { type: EncounterType.CHANCE, weight: 15 },
    { type: EncounterType.MERCHANT, weight: 10 },
    { type: EncounterType.ROULETTE, weight: 10 },
  ],
  [ChapterType.THIRTY_DAY]: [
    { type: EncounterType.COMBAT, weight: 35 },
    { type: EncounterType.ANGEL, weight: 20 },
    { type: EncounterType.DEMON, weight: 10 },
    { type: EncounterType.CHANCE, weight: 15 },
    { type: EncounterType.MERCHANT, weight: 10 },
    { type: EncounterType.LUCKY_MACHINE, weight: 10 },
  ],
  [ChapterType.FIVE_DAY]: [
    { type: EncounterType.COMBAT, weight: 70 },
    { type: EncounterType.ANGEL, weight: 20 },
    { type: EncounterType.CHANCE, weight: 10 },
  ],
};

function emptyReward(): EncounterReward {
  return { skills: [], healPercent: 0, reward: Reward.empty() };
}

function skillReward(skills: Skill[]): EncounterReward {
  return { skills, healPercent: 0, reward: Reward.empty() };
}

function healReward(percent: number): EncounterReward {
  return { skills: [], healPercent: percent, reward: Reward.empty() };
}

function resourceReward(type: ResourceType, amount: number): EncounterReward {
  return { skills: [], healPercent: 0, reward: Reward.fromResources({ type, amount }) };
}

export class EncounterGenerator {
  private rng: SeededRandom;

  constructor(seed: number) {
    this.rng = new SeededRandom(seed);
  }

  generate(chapterType: ChapterType, _day: number, existingSkillIds: string[]): Encounter {
    const weights = ENCOUNTER_WEIGHTS[chapterType];
    const type = this.rng.weightedPick(
      weights.map(w => ({ item: w.type, weight: w.weight }))
    );

    switch (type) {
      case EncounterType.ANGEL: return this.createAngelEncounter(existingSkillIds);
      case EncounterType.DEMON: return this.createDemonEncounter(existingSkillIds);
      case EncounterType.COMBAT: return this.createCombatEncounter();
      case EncounterType.CHANCE: return this.createChanceEncounter();
      case EncounterType.MERCHANT: return this.createMerchantEncounter(existingSkillIds);
      case EncounterType.ROULETTE: return this.createRouletteEncounter();
      case EncounterType.LUCKY_MACHINE: return this.createLuckyMachineEncounter();
      default: return this.createCombatEncounter();
    }
  }

  private getRandomSkills(count: number, excludeIds: string[]): Skill[] {
    const all = SkillTable.getAllSkills().filter(s => !excludeIds.includes(s.id));
    const normalSkills = all.filter(s => s.grade === SkillGrade.NORMAL || s.grade === SkillGrade.LEGENDARY);

    const result: Skill[] = [];
    const pool = [...normalSkills];
    for (let i = 0; i < count && pool.length > 0; i++) {
      const idx = this.rng.nextInt(0, pool.length - 1);
      result.push(pool[idx]);
      pool.splice(idx, 1);
    }
    return result;
  }

  private createAngelEncounter(existingSkillIds: string[]): Encounter {
    const skills = this.getRandomSkills(2, existingSkillIds);

    const options: EncounterOption[] = [];

    for (const skill of skills) {
      options.push({
        label: `Gain: ${skill.name}`,
        description: `Acquire ${skill.name} skill`,
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 1.0,
        reward: skillReward([skill]),
      });
    }

    options.push({
      label: 'Heal 30%',
      description: 'Recover 30% of max HP',
      hpCostPercent: 0,
      goldCost: 0,
      successRate: 1.0,
      reward: healReward(0.3),
    });

    return new Encounter(EncounterType.ANGEL, options);
  }

  private createDemonEncounter(existingSkillIds: string[]): Encounter {
    const allSkills = SkillTable.getAllSkills().filter(s => !existingSkillIds.includes(s.id));
    const skill = allSkills.length > 0
      ? allSkills[this.rng.nextInt(0, allSkills.length - 1)]
      : null;

    const options: EncounterOption[] = [];

    if (skill) {
      options.push({
        label: `Sacrifice: ${skill.name}`,
        description: `Lose 20% max HP, gain ${skill.name}`,
        hpCostPercent: 0.2,
        goldCost: 0,
        successRate: 1.0,
        reward: skillReward([skill]),
      });
    }

    options.push({
      label: 'Refuse',
      description: 'Walk away safely',
      hpCostPercent: 0,
      goldCost: 0,
      successRate: 1.0,
      reward: emptyReward(),
    });

    return new Encounter(EncounterType.DEMON, options);
  }

  private createCombatEncounter(): Encounter {
    const options: EncounterOption[] = [
      {
        label: 'Fight',
        description: 'Engage in battle',
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 1.0,
        reward: emptyReward(),
      },
      {
        label: 'Avoid',
        description: 'Skip this encounter',
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 1.0,
        reward: emptyReward(),
      },
    ];

    return new Encounter(EncounterType.COMBAT, options);
  }

  private createChanceEncounter(): Encounter {
    const roll = this.rng.nextInt(0, 2);
    const options: EncounterOption[] = [];

    switch (roll) {
      case 0:
        options.push({
          label: 'Open Chest',
          description: 'Found a treasure chest!',
          hpCostPercent: 0,
          goldCost: 0,
          successRate: 1.0,
          reward: resourceReward(ResourceType.GOLD, 100 + this.rng.nextInt(0, 200)),
        });
        break;
      case 1:
        options.push({
          label: 'Healing Spring',
          description: 'A magical spring',
          hpCostPercent: 0,
          goldCost: 0,
          successRate: 1.0,
          reward: healReward(0.5),
        });
        break;
      case 2:
        options.push({
          label: 'Blessing',
          description: 'Receive a divine blessing',
          hpCostPercent: 0,
          goldCost: 0,
          successRate: 1.0,
          reward: resourceReward(ResourceType.GOLD, 200),
        });
        break;
    }

    return new Encounter(EncounterType.CHANCE, options);
  }

  private createMerchantEncounter(existingSkillIds: string[]): Encounter {
    const skills = this.getRandomSkills(3, existingSkillIds);
    const options: EncounterOption[] = [];

    for (const skill of skills) {
      const price = skill.grade === SkillGrade.LEGENDARY ? 300 : 150;
      options.push({
        label: `Buy: ${skill.name} (${price}g)`,
        description: `Purchase ${skill.name} for ${price} gold`,
        hpCostPercent: 0,
        goldCost: price,
        successRate: 1.0,
        reward: skillReward([skill]),
      });
    }

    options.push({
      label: 'Leave',
      description: 'Leave the merchant',
      hpCostPercent: 0,
      goldCost: 0,
      successRate: 1.0,
      reward: emptyReward(),
    });

    return new Encounter(EncounterType.MERCHANT, options);
  }

  private createRouletteEncounter(): Encounter {
    const mythicSkills = SkillTable.getSkillsByGrade(SkillGrade.MYTHIC);
    const immortalSkills = SkillTable.getSkillsByGrade(SkillGrade.IMMORTAL);

    const options: EncounterOption[] = [
      {
        label: 'Normal Spin',
        description: '80% chance for a Mythic skill',
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 0.8,
        reward: skillReward(mythicSkills.length > 0 ? [this.rng.pick(mythicSkills)] : []),
      },
      {
        label: 'Big Spin',
        description: '30% chance for an Immortal skill',
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 0.3,
        reward: skillReward(immortalSkills.length > 0 ? [this.rng.pick(immortalSkills)] : []),
      },
      {
        label: 'Skip',
        description: 'Walk away',
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 1.0,
        reward: emptyReward(),
      },
    ];

    return new Encounter(EncounterType.ROULETTE, options);
  }

  private createLuckyMachineEncounter(): Encounter {
    const goldReward = 500;
    const options: EncounterOption[] = [
      {
        label: 'Safe Machine (100%)',
        description: `100% chance, gain ${Math.floor(goldReward * 0.5)}g`,
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 1.0,
        reward: resourceReward(ResourceType.GOLD, Math.floor(goldReward * 0.5)),
      },
      {
        label: 'Normal Machine (70%)',
        description: `70% chance, gain ${goldReward}g`,
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 0.7,
        reward: resourceReward(ResourceType.GOLD, goldReward),
      },
      {
        label: 'Risky Machine (40%)',
        description: `40% chance, gain ${goldReward * 2}g`,
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 0.4,
        reward: resourceReward(ResourceType.GOLD, goldReward * 2),
      },
    ];

    return new Encounter(EncounterType.LUCKY_MACHINE, options);
  }
}
