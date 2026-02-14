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
        label: `획득: ${skill.name}`,
        description: `${skill.name} 스킬 획득`,
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 1.0,
        reward: skillReward([skill]),
      });
    }

    options.push({
      label: '체력 30% 회복',
      description: '최대 체력의 30% 회복',
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
        label: `희생: ${skill.name}`,
        description: `최대 체력 20% 소모, ${skill.name} 획득`,
        hpCostPercent: 0.2,
        goldCost: 0,
        successRate: 1.0,
        reward: skillReward([skill]),
      });
    }

    options.push({
      label: '거절',
      description: '안전하게 떠나기',
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
        label: '전투',
        description: '전투에 돌입',
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 1.0,
        reward: emptyReward(),
      },
      {
        label: '회피',
        description: '이번 전투 건너뛰기',
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
          label: '상자 열기',
          description: '보물 상자를 발견했다!',
          hpCostPercent: 0,
          goldCost: 0,
          successRate: 1.0,
          reward: resourceReward(ResourceType.GOLD, 100 + this.rng.nextInt(0, 200)),
        });
        break;
      case 1:
        options.push({
          label: '치유의 샘',
          description: '마법의 샘',
          hpCostPercent: 0,
          goldCost: 0,
          successRate: 1.0,
          reward: healReward(0.5),
        });
        break;
      case 2:
        options.push({
          label: '축복',
          description: '신성한 축복을 받다',
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
        label: `구매: ${skill.name} (${price}g)`,
        description: `${skill.name}을(를) ${price} 골드에 구매`,
        hpCostPercent: 0,
        goldCost: price,
        successRate: 1.0,
        reward: skillReward([skill]),
      });
    }

    options.push({
      label: '떠나기',
      description: '상인을 떠나기',
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
        label: '일반 돌리기',
        description: '80% 확률로 신화 스킬 획득',
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 0.8,
        reward: skillReward(mythicSkills.length > 0 ? [this.rng.pick(mythicSkills)] : []),
      },
      {
        label: '대박 돌리기',
        description: '30% 확률로 불멸 스킬 획득',
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 0.3,
        reward: skillReward(immortalSkills.length > 0 ? [this.rng.pick(immortalSkills)] : []),
      },
      {
        label: '건너뛰기',
        description: '그냥 지나가기',
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
        label: '안전 머신 (100%)',
        description: `100% 확률, ${Math.floor(goldReward * 0.5)}골드 획득`,
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 1.0,
        reward: resourceReward(ResourceType.GOLD, Math.floor(goldReward * 0.5)),
      },
      {
        label: '일반 머신 (70%)',
        description: `70% 확률, ${goldReward}골드 획득`,
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 0.7,
        reward: resourceReward(ResourceType.GOLD, goldReward),
      },
      {
        label: '위험 머신 (40%)',
        description: `40% 확률, ${goldReward * 2}골드 획득`,
        hpCostPercent: 0,
        goldCost: 0,
        successRate: 0.4,
        reward: resourceReward(ResourceType.GOLD, goldReward * 2),
      },
    ];

    return new Encounter(EncounterType.LUCKY_MACHINE, options);
  }
}
