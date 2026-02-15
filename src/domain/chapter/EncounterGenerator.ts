import { EncounterType, ChapterType, ResourceType, SkillGrade } from '../enums';
import { Encounter } from './Encounter';
import type { EncounterOption, EncounterReward } from './Encounter';
import { Reward } from '../value-objects/Reward';
import { Skill } from '../entities/Skill';
import { SkillTable } from '../data/SkillTable';
import { EncounterDataTable } from '../data/EncounterDataTable';
import { SeededRandom } from '../../infrastructure/SeededRandom';

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
    const weights = EncounterDataTable.getWeights(chapterType);
    const type = this.rng.weightedPick(
      weights.map(w => ({ item: w.type, weight: w.weight }))
    );

    switch (type) {
      case EncounterType.ANGEL: return this.createAngelEncounter(existingSkillIds);
      case EncounterType.DEMON: return this.createDemonEncounter(existingSkillIds);
      case EncounterType.COMBAT: return this.createCombatEncounter();
      case EncounterType.CHANCE: return this.createChanceEncounter();
      default: return this.createCombatEncounter();
    }
  }

  generateJungbakRoulette(existingSkillIds: string[]): Encounter {
    return this.createJungbakRouletteEncounter(existingSkillIds);
  }

  generateDaebakRoulette(existingSkillIds: string[]): Encounter {
    return this.createDaebakRouletteEncounter(existingSkillIds);
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
    const d = EncounterDataTable.angel;

    const options: EncounterOption[] = [];

    for (const skill of skills) {
      options.push({
        label: d.skillLabel(skill.icon, skill.name),
        description: d.skillDescription(skill.description),
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 1.0,
        reward: skillReward([skill]),
      });
    }

    options.push({
      label: d.healLabel,
      description: d.healDescription,
      hpCostPercent: 0,
      goldCost: 0,
      successRate: 1.0,
      reward: healReward(d.healPercent),
    });

    return new Encounter(EncounterType.ANGEL, options);
  }

  private createDemonEncounter(existingSkillIds: string[]): Encounter {
    const allSkills = SkillTable.getAllSkills().filter(s => !existingSkillIds.includes(s.id));
    const skill = allSkills.length > 0
      ? allSkills[this.rng.nextInt(0, allSkills.length - 1)]
      : null;
    const d = EncounterDataTable.demon;

    const options: EncounterOption[] = [];

    if (skill) {
      options.push({
        label: d.skillLabel(skill.icon, skill.name),
        description: d.skillDescription(skill.description),
        hpCostPercent: d.hpCostPercent,
        goldCost: 0,
        successRate: 1.0,
        reward: skillReward([skill]),
      });
    }

    options.push({
      label: d.rejectLabel,
      description: d.rejectDescription,
      hpCostPercent: 0,
      goldCost: 0,
      successRate: 1.0,
      reward: emptyReward(),
    });

    return new Encounter(EncounterType.DEMON, options);
  }

  private createCombatEncounter(): Encounter {
    const d = EncounterDataTable.combat;
    const options: EncounterOption[] = [
      {
        label: d.fightLabel,
        description: d.fightDescription,
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 1.0,
        reward: emptyReward(),
      },
      {
        label: d.avoidLabel,
        description: d.avoidDescription,
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
    const d = EncounterDataTable.chance;
    const options: EncounterOption[] = [];

    switch (roll) {
      case 0: {
        const goldAmount = d.boxGoldMin + this.rng.nextInt(0, d.boxGoldMax - d.boxGoldMin);
        options.push({
          label: d.boxLabel,
          description: d.boxDescription,
          hpCostPercent: 0,
          goldCost: 0,
          successRate: 1.0,
          reward: resourceReward(ResourceType.GOLD, goldAmount),
        });
        break;
      }
      case 1:
        options.push({
          label: d.springLabel,
          description: d.springDescription,
          hpCostPercent: 0,
          goldCost: 0,
          successRate: 1.0,
          reward: healReward(d.springHealPercent),
        });
        break;
      case 2:
        options.push({
          label: d.blessingLabel,
          description: d.blessingDescription,
          hpCostPercent: 0,
          goldCost: 0,
          successRate: 1.0,
          reward: resourceReward(ResourceType.GOLD, d.blessingGold),
        });
        break;
    }

    return new Encounter(EncounterType.CHANCE, options);
  }

  private createJungbakRouletteEncounter(existingSkillIds: string[]): Encounter {
    const d = EncounterDataTable.jungbakRoulette;
    const skills = this.getRandomSkills(1, existingSkillIds);
    const skill = skills.length > 0 ? skills[0] : null;

    const options: EncounterOption[] = [
      {
        label: d.healLabel,
        description: d.healDescription,
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 1.0,
        reward: healReward(d.healPercent),
      },
    ];

    if (skill) {
      options.push({
        label: d.skillLabel(skill.icon, skill.name),
        description: d.skillDescription(skill.description),
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 1.0,
        reward: skillReward([skill]),
      });
    }

    options.push({
      label: d.goldLabel,
      description: d.goldDescription,
      hpCostPercent: 0,
      goldCost: 0,
      successRate: 1.0,
      reward: resourceReward(ResourceType.GOLD, d.goldAmount),
    });

    return new Encounter(EncounterType.JUNGBAK_ROULETTE, options);
  }

  private createDaebakRouletteEncounter(existingSkillIds: string[]): Encounter {
    const mythicSkills = SkillTable.getSkillsByGrade(SkillGrade.MYTHIC)
      .filter(s => !existingSkillIds.includes(s.id));
    const immortalSkills = SkillTable.getSkillsByGrade(SkillGrade.IMMORTAL)
      .filter(s => !existingSkillIds.includes(s.id));
    const d = EncounterDataTable.daebakRoulette;

    const mythicSkill = mythicSkills.length > 0 ? this.rng.pick(mythicSkills) : null;
    const immortalSkill = immortalSkills.length > 0 ? this.rng.pick(immortalSkills) : null;

    const options: EncounterOption[] = [
      {
        label: d.normalLabel,
        description: mythicSkill
          ? `${mythicSkill.icon} ${mythicSkill.name}: ${mythicSkill.description}`
          : d.normalDescription,
        hpCostPercent: 0,
        goldCost: 0,
        successRate: d.normalRate,
        reward: skillReward(mythicSkill ? [mythicSkill] : []),
      },
      {
        label: d.jackpotLabel,
        description: immortalSkill
          ? `${immortalSkill.icon} ${immortalSkill.name}: ${immortalSkill.description}`
          : d.jackpotDescription,
        hpCostPercent: 0,
        goldCost: 0,
        successRate: d.jackpotRate,
        reward: skillReward(immortalSkill ? [immortalSkill] : []),
      },
      {
        label: d.skipLabel,
        description: d.skipDescription,
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 1.0,
        reward: emptyReward(),
      },
    ];

    return new Encounter(EncounterType.DAEBAK_ROULETTE, options);
  }
}
