import { StatType, TalentGrade, ResourceType } from '../enums';
import { Stats } from '../value-objects/Stats';
import data from './json/talent.data.json';

const STAT_PER_LEVEL = data.statPerLevel as Record<StatType, number>;
const GRADE_ORDER = data.gradeOrder as TalentGrade[];
const LEVELS_PER_TIER = data.levelsPerTier;
const LEVELS_PER_STAT = data.levelsPerStat;
const GRADE_CONFIGS = data.gradeConfig as {
  grade: TalentGrade; tiers: number; baseCost: number; costGrowth: number; tierBonusBase: number; tierBonusGrowth: number;
}[];
const MAIN_GRADE_BONUSES = data.mainGradeBonuses as { grade: TalentGrade; stat: string; amount: number }[];

export const GRADE_LABELS: Record<TalentGrade, string> = {
  [TalentGrade.DISCIPLE]: '수련생',
  [TalentGrade.ADVENTURER]: '모험가',
  [TalentGrade.ELITE]: '정예',
  [TalentGrade.MASTER]: '달인',
  [TalentGrade.WARRIOR]: '전사',
  [TalentGrade.HERO]: '영웅',
};

interface SubGradeRange {
  grade: TalentGrade;
  tier: number;
  levels: number;
  cost: number;
  bonus?: { stat: string; amount: number };
  startLevel: number;
  endLevel: number;
}

function buildSubGradeRanges(): SubGradeRange[] {
  const ranges: SubGradeRange[] = [];
  let cumLevel = 0;
  let bonusIdx = 0;

  for (const gc of GRADE_CONFIGS) {
    const mainBonus = MAIN_GRADE_BONUSES.find(b => b.grade === gc.grade);
    let subTierIdx = 0;

    for (let tier = 1; tier <= gc.tiers; tier++) {
      const cost = Math.floor(gc.baseCost * Math.pow(gc.costGrowth, tier - 1));
      let bonus: { stat: string; amount: number } | undefined;

      if (cumLevel > 0) {
        if (tier === 1 && mainBonus) {
          bonus = { stat: mainBonus.stat, amount: mainBonus.amount };
        } else {
          bonus = {
            stat: bonusIdx % 2 === 0 ? 'DEF' : 'ATK',
            amount: gc.tierBonusBase + subTierIdx * gc.tierBonusGrowth,
          };
          subTierIdx++;
        }
        bonusIdx++;
      }

      ranges.push({
        grade: gc.grade,
        tier,
        levels: LEVELS_PER_TIER,
        cost,
        bonus,
        startLevel: cumLevel,
        endLevel: cumLevel + LEVELS_PER_TIER,
      });
      cumLevel += LEVELS_PER_TIER;
    }
  }
  return ranges;
}

const SUB_GRADE_RANGES = buildSubGradeRanges();
const TOTAL_MAX_LEVEL = SUB_GRADE_RANGES[SUB_GRADE_RANGES.length - 1].endLevel;

function buildGradeThresholds(): { grade: TalentGrade; totalLevel: number }[] {
  const seen = new Set<TalentGrade>();
  const thresholds: { grade: TalentGrade; totalLevel: number }[] = [];
  for (const r of SUB_GRADE_RANGES) {
    if (!seen.has(r.grade)) {
      seen.add(r.grade);
      thresholds.push({ grade: r.grade, totalLevel: r.startLevel });
    }
  }
  const lastGrade = GRADE_ORDER[GRADE_ORDER.length - 1];
  if (!seen.has(lastGrade)) {
    thresholds.push({ grade: lastGrade, totalLevel: TOTAL_MAX_LEVEL });
  }
  return thresholds;
}

const GRADE_THRESHOLDS = buildGradeThresholds();

export type MilestoneRewardType = ResourceType | 'GOLD_BOOST';

export interface TalentMilestone {
  level: number;
  rewardType: MilestoneRewardType;
  rewardAmount: number;
}

export interface SubGradeInfo {
  grade: TalentGrade;
  tier: number;
  tierCount: number;
  levelInTier: number;
  tierLevels: number;
  cost: number;
}

export interface TransitionInfo {
  level: number;
  grade: TalentGrade;
  tier: number;
  isMainGrade: boolean;
  bonus: { stat: string; amount: number };
}

function getUpgradeCostAtLevel(totalLevel: number): number {
  for (const r of SUB_GRADE_RANGES) {
    if (totalLevel < r.endLevel) return r.cost;
  }
  return SUB_GRADE_RANGES[SUB_GRADE_RANGES.length - 1].cost;
}

function generateMilestones(): TalentMilestone[] {
  const config = data.milestoneConfig;
  const result: TalentMilestone[] = [];
  const boundaries = new Set(SUB_GRADE_RANGES.map(r => r.endLevel));

  const levels: number[] = [];
  for (let lv = config.interval; lv <= TOTAL_MAX_LEVEL; lv += config.interval) {
    if (!boundaries.has(lv)) levels.push(lv);
  }

  for (const level of levels) {
    if (result.length % 2 === 0) {
      result.push({
        level,
        rewardType: ResourceType.GOLD,
        rewardAmount: getUpgradeCostAtLevel(level) * config.goldCostMultiplier,
      });
    } else {
      result.push({
        level,
        rewardType: 'GOLD_BOOST',
        rewardAmount: config.goldBoostPercent,
      });
    }
  }

  return result;
}

const MILESTONES = generateMilestones();

function buildMainTransitions(): TransitionInfo[] {
  const transitions: TransitionInfo[] = [];

  for (const mb of MAIN_GRADE_BONUSES) {
    const threshold = GRADE_THRESHOLDS.find(t => t.grade === mb.grade);
    if (!threshold) continue;
    transitions.push({
      level: threshold.totalLevel,
      grade: mb.grade,
      tier: 1,
      isMainGrade: true,
      bonus: { stat: mb.stat, amount: mb.amount },
    });
  }

  return transitions;
}

const MAIN_TRANSITIONS = buildMainTransitions();

function buildAllTransitions(): TransitionInfo[] {
  const mainLevels = new Set(MAIN_TRANSITIONS.map(t => t.level));
  const transitions: TransitionInfo[] = [];
  for (const r of SUB_GRADE_RANGES) {
    if (r.startLevel === 0 || !r.bonus) continue;
    transitions.push({
      level: r.startLevel,
      grade: r.grade,
      tier: r.tier,
      isMainGrade: mainLevels.has(r.startLevel),
      bonus: r.bonus,
    });
  }
  return transitions;
}

const ALL_TRANSITIONS = buildAllTransitions();

export const TalentTable = {
  getStatPerLevel(statType: StatType): number {
    return STAT_PER_LEVEL[statType];
  },

  getUpgradeCost(totalLevel: number): number {
    for (const r of SUB_GRADE_RANGES) {
      if (totalLevel < r.endLevel) return r.cost;
    }
    return SUB_GRADE_RANGES[SUB_GRADE_RANGES.length - 1].cost;
  },

  getSubGradeInfo(totalLevel: number): SubGradeInfo {
    for (const r of SUB_GRADE_RANGES) {
      if (totalLevel < r.endLevel) {
        const gc = GRADE_CONFIGS.find(g => g.grade === r.grade)!;
        return {
          grade: r.grade,
          tier: r.tier,
          tierCount: gc.tiers,
          levelInTier: totalLevel - r.startLevel,
          tierLevels: r.levels,
          cost: r.cost,
        };
      }
    }
    const lastGrade = GRADE_ORDER[GRADE_ORDER.length - 1];
    return {
      grade: lastGrade,
      tier: 1,
      tierCount: 1,
      levelInTier: totalLevel - TOTAL_MAX_LEVEL,
      tierLevels: 0,
      cost: SUB_GRADE_RANGES[SUB_GRADE_RANGES.length - 1].cost,
    };
  },

  getMaxLevel(): number {
    return TOTAL_MAX_LEVEL;
  },

  getGradeForTotalLevel(totalLevel: number): TalentGrade {
    let result = GRADE_ORDER[0];
    for (const threshold of GRADE_THRESHOLDS) {
      if (totalLevel >= threshold.totalLevel) {
        result = threshold.grade;
      }
    }
    return result;
  },

  getGradeOrder(): TalentGrade[] {
    return GRADE_ORDER;
  },

  getGradeIndex(grade: TalentGrade): number {
    return GRADE_ORDER.indexOf(grade);
  },

  getNextGradeThreshold(currentGrade: TalentGrade): number | null {
    const idx = GRADE_ORDER.indexOf(currentGrade);
    if (idx >= GRADE_ORDER.length - 1) return null;
    const nextGrade = GRADE_ORDER[idx + 1];
    const threshold = GRADE_THRESHOLDS.find(t => t.grade === nextGrade);
    return threshold?.totalLevel ?? null;
  },

  getGradeStartLevel(grade: TalentGrade): number {
    const threshold = GRADE_THRESHOLDS.find(t => t.grade === grade);
    return threshold?.totalLevel ?? 0;
  },

  getStatBonus(totalLevel: number): Stats {
    let atk = 0;
    let def = 0;

    for (const r of SUB_GRADE_RANGES) {
      if (totalLevel < r.startLevel) break;
      if (!r.bonus) continue;
      if (r.bonus.stat === 'ATK') atk += r.bonus.amount;
      else if (r.bonus.stat === 'DEF') def += r.bonus.amount;
    }

    const heroBonus = MAIN_GRADE_BONUSES.find(b => b.grade === GRADE_ORDER[GRADE_ORDER.length - 1]);
    if (heroBonus && totalLevel >= TOTAL_MAX_LEVEL) {
      if (heroBonus.stat === 'ATK') atk += heroBonus.amount;
      else if (heroBonus.stat === 'DEF') def += heroBonus.amount;
    }

    return Stats.create({ atk, def });
  },

  getAllTransitions(): TransitionInfo[] {
    return ALL_TRANSITIONS;
  },

  getMainTransitions(): TransitionInfo[] {
    return MAIN_TRANSITIONS;
  },

  getMilestonesInRange(fromLevel: number, toLevel: number): TalentMilestone[] {
    return MILESTONES.filter(m => m.level > fromLevel && m.level < toLevel);
  },

  getAllMilestones(): TalentMilestone[] {
    return MILESTONES;
  },

  getLevelsPerStat(): number {
    return LEVELS_PER_STAT;
  },

  getLevelsPerTier(): number {
    return LEVELS_PER_TIER;
  },

  getSubGradeLabel(totalLevel: number): string {
    const info = this.getSubGradeInfo(totalLevel);
    const gradeLabel = GRADE_LABELS[info.grade] ?? info.grade;
    return `${gradeLabel} ${info.tier}단`;
  },
};
