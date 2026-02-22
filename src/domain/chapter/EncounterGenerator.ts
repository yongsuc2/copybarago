import { EncounterType, ChapterType, ResourceType } from '../enums';
import { Encounter } from './Encounter';
import type { EncounterOption, EncounterReward } from './Encounter';
import { Reward } from '../value-objects/Reward';
import type { SessionSkill } from '../battle/BattleUnit';
import { isActiveSkill } from '../battle/BattleUnit';
import { ActiveSkillRegistry } from '../data/ActiveSkillRegistry';
import { PassiveSkillRegistry } from '../data/PassiveSkillRegistry';
import { EncounterDataTable } from '../data/EncounterDataTable';
import { SeededRandom } from '../../infrastructure/SeededRandom';

function emptyReward(): EncounterReward {
  return { skills: [], healPercent: 0, reward: Reward.empty(), skillIdsToRemove: [] };
}

function skillReward(skills: SessionSkill[]): EncounterReward {
  return { skills, healPercent: 0, reward: Reward.empty(), skillIdsToRemove: [] };
}

function healReward(percent: number): EncounterReward {
  return { skills: [], healPercent: percent, reward: Reward.empty(), skillIdsToRemove: [] };
}

function resourceReward(type: ResourceType, amount: number): EncounterReward {
  return { skills: [], healPercent: 0, reward: Reward.fromResources({ type, amount }), skillIdsToRemove: [] };
}

function swapReward(newSkill: SessionSkill, oldSkillId: string): EncounterReward {
  return { skills: [newSkill], healPercent: 0, reward: Reward.empty(), skillIdsToRemove: [oldSkillId] };
}

function buildSkillPool(ownedSkills: SessionSkill[]): SessionSkill[] {
  const ownedMap = new Map<string, number>();
  for (const s of ownedSkills) {
    ownedMap.set(s.id, s.tier);
  }

  const pool: SessionSkill[] = [];

  for (const tier1 of ActiveSkillRegistry.getUpperTier1Skills()) {
    if (!ownedMap.has(tier1.id)) {
      pool.push(tier1);
    }
  }

  for (const tier1 of PassiveSkillRegistry.getTier1Skills()) {
    if (!ownedMap.has(tier1.id)) {
      pool.push(tier1);
    }
  }

  for (const [familyId, currentTier] of ownedMap) {
    if (ActiveSkillRegistry.isSpecialSkill(familyId) || PassiveSkillRegistry.isSpecialSkill(familyId)) continue;
    if (ActiveSkillRegistry.isBuiltinSkill(familyId)) continue;

    const nextActive = ActiveSkillRegistry.getNextTier(familyId, currentTier);
    if (nextActive) { pool.push(nextActive); continue; }

    const nextPassive = PassiveSkillRegistry.getNextTier(familyId, currentTier);
    if (nextPassive) { pool.push(nextPassive); }
  }

  return pool;
}

function isSpecialSkill(id: string): boolean {
  return ActiveSkillRegistry.isSpecialSkill(id) || PassiveSkillRegistry.isSpecialSkill(id);
}

export class EncounterGenerator {
  private rng: SeededRandom;

  constructor(seed: number) {
    this.rng = new SeededRandom(seed);
  }

  generate(chapterType: ChapterType, _day: number, ownedSkills: SessionSkill[], chapterId: number = 1): Encounter {
    const weights = EncounterDataTable.getWeights(chapterType);
    const type = this.rng.weightedPick(
      weights.map(w => ({ item: w.type, weight: w.weight }))
    );

    switch (type) {
      case EncounterType.DEMON: return this.createDemonEncounter(ownedSkills);
      case EncounterType.COMBAT: return this.createCombatEncounter();
      case EncounterType.CHANCE: return this.createChanceEncounter(ownedSkills, chapterId);
      default: return this.createCombatEncounter();
    }
  }

  regenerate(type: EncounterType, ownedSkills: SessionSkill[], chapterId: number): Encounter {
    switch (type) {
      case EncounterType.DEMON: return this.createDemonEncounter(ownedSkills);
      case EncounterType.CHANCE: return this.createChanceEncounter(ownedSkills, chapterId);
      default: return this.createCombatEncounter();
    }
  }

  generateJungbakRoulette(ownedSkills: SessionSkill[]): Encounter {
    return this.createJungbakRouletteEncounter(ownedSkills);
  }

  generateDaebakRoulette(ownedSkills: SessionSkill[]): Encounter {
    return this.createDaebakRouletteEncounter(ownedSkills);
  }

  private getRandomSkills(count: number, ownedSkills: SessionSkill[], maxTier?: number): SessionSkill[] {
    let pool = buildSkillPool(ownedSkills);
    if (maxTier !== undefined) {
      pool = pool.filter(s => s.tier <= maxTier);
    }

    const result: SessionSkill[] = [];
    const candidates = [...pool];
    for (let i = 0; i < count && candidates.length > 0; i++) {
      const idx = this.rng.nextInt(0, candidates.length - 1);
      result.push(candidates[idx]);
      candidates.splice(idx, 1);
    }
    return result;
  }

  private createDemonEncounter(ownedSkills: SessionSkill[]): Encounter {
    const skills = this.getRandomSkills(1, ownedSkills);
    const skill = skills.length > 0 ? skills[0] : null;
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

  private createChanceEncounter(ownedSkills: SessionSkill[], chapterId: number): Encounter {
    const tier1Owned = ownedSkills.filter(s => s.tier === 1 && !isSpecialSkill(s.id));
    const canSwap = tier1Owned.length > 0;
    const d = EncounterDataTable.chance;
    const w = d.subWeights;
    const entries = [
      { item: 0, weight: w.skillBox },
      { item: 1, weight: w.spring },
      { item: 2, weight: w.blessing },
    ];
    if (canSwap) entries.push({ item: 3, weight: w.skillSwap });
    const roll = this.rng.weightedPick(entries);
    const options: EncounterOption[] = [];

    switch (roll) {
      case 0: {
        const skills = this.getRandomSkills(3, ownedSkills);
        for (const skill of skills) {
          options.push({
            label: `${skill.icon} ${skill.name}`,
            description: skill.description,
            hpCostPercent: 0,
            goldCost: 0,
            successRate: 1.0,
            reward: skillReward([skill]),
          });
        }
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
      case 2: {
        const goldAmount = d.blessingGoldBase + this.rng.nextInt(0, d.blessingGoldPerChapter * chapterId);
        options.push({
          label: d.blessingLabel,
          description: `골드 ${goldAmount} 획득`,
          hpCostPercent: 0,
          goldCost: 0,
          successRate: 1.0,
          reward: resourceReward(ResourceType.GOLD, goldAmount),
        });
        break;
      }
      case 3: {
        const newSkills = this.getRandomSkills(3, ownedSkills, 1);
        if (newSkills.length === 0) {
          options.push({
            label: d.springLabel,
            description: d.springDescription,
            hpCostPercent: 0,
            goldCost: 0,
            successRate: 1.0,
            reward: healReward(d.springHealPercent),
          });
          break;
        }
        const oldSkill = this.rng.pick(tier1Owned);
        const sw = EncounterDataTable.skillSwap;
        for (const newSkill of newSkills) {
          options.push({
            label: `${oldSkill.icon} ${oldSkill.name} → ${newSkill.icon} ${newSkill.name}`,
            description: newSkill.description,
            hpCostPercent: 0,
            goldCost: 0,
            successRate: 1.0,
            reward: swapReward(newSkill, oldSkill.id),
          });
        }
        options.push({
          label: sw.skipLabel,
          description: sw.skipDescription,
          hpCostPercent: 0,
          goldCost: 0,
          successRate: 1.0,
          reward: emptyReward(),
        });
        break;
      }
    }

    return new Encounter(EncounterType.CHANCE, options);
  }

  private createJungbakRouletteEncounter(ownedSkills: SessionSkill[]): Encounter {
    const d = EncounterDataTable.jungbakRoulette;
    const skills = this.getRandomSkills(1, ownedSkills);
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

  private createDaebakRouletteEncounter(ownedSkills: SessionSkill[]): Encounter {
    const ownedMap = new Map(ownedSkills.map(s => [s.id, s.tier]));

    const pool = buildSkillPool(ownedSkills);
    const mythicPool = pool.filter(s => s.tier === 3);
    const d = EncounterDataTable.daebakRoulette;

    const mythicSkill = mythicPool.length > 0 ? this.rng.pick(mythicPool) : null;

    const angelPower = !ownedMap.has('angel_power') ? PassiveSkillRegistry.getById('angel_power', 4) : null;
    const demonPower = !ownedMap.has('demon_power') ? ActiveSkillRegistry.getById('demon_power', 4) : null;

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
    ];

    if (angelPower) {
      options.push({
        label: d.angelLabel,
        description: `${angelPower.icon} ${angelPower.name}: ${angelPower.description}`,
        hpCostPercent: 0,
        goldCost: 0,
        successRate: d.angelRate,
        reward: skillReward([angelPower]),
      });
    }

    if (demonPower) {
      options.push({
        label: d.demonLabel,
        description: `${demonPower.icon} ${demonPower.name}: ${demonPower.description}`,
        hpCostPercent: 0,
        goldCost: 0,
        successRate: d.demonRate,
        reward: skillReward([demonPower]),
      });
    }

    options.push({
      label: d.skipLabel,
      description: d.skipDescription,
      hpCostPercent: 0,
      goldCost: 0,
      successRate: 1.0,
      reward: emptyReward(),
    });

    return new Encounter(EncounterType.DAEBAK_ROULETTE, options);
  }
}
