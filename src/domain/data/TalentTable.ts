import { StatType, TalentGrade, ResourceType } from '../enums';
import { Stats } from '../value-objects/Stats';
import data from './json/talent.data.json';

const STAT_PER_LEVEL = data.statPerLevel as Record<StatType, number>;
const GRADE_THRESHOLDS = data.gradeThresholds as { grade: TalentGrade; totalLevel: number }[];
const GRADE_ORDER = data.gradeOrder as TalentGrade[];
const GRADE_STAT_BONUSES = data.gradeStatBonuses as { grade: TalentGrade; stat: string; amount: number }[];

export type MilestoneRewardType = ResourceType | 'GOLD_BOOST';

export interface TalentMilestone {
  level: number;
  rewardType: MilestoneRewardType;
  rewardAmount: number;
}

const GRADE_THRESHOLD_LEVELS = new Set(
  GRADE_THRESHOLDS.filter(t => t.totalLevel > 0).map(t => t.totalLevel),
);

function generateMilestones(): TalentMilestone[] {
  const config = data.milestoneConfig;
  const maxLevel = GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1].totalLevel;
  const result: TalentMilestone[] = [];
  let goldCount = 0;

  for (let level = config.interval; level <= maxLevel; level += config.interval) {
    if (GRADE_THRESHOLD_LEVELS.has(level)) continue;

    if (result.length % 2 === 0) {
      result.push({
        level,
        rewardType: ResourceType.GOLD,
        rewardAmount: Math.floor(config.goldBase * Math.pow(config.goldGrowthRate, goldCount)),
      });
      goldCount++;
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

export const TalentTable = {
  getStatPerLevel(statType: StatType): number {
    return STAT_PER_LEVEL[statType];
  },

  getUpgradeCost(level: number): number {
    return Math.floor(data.baseUpgradeCost * Math.pow(data.costGrowthRate, level));
  },

  getGradeForTotalLevel(totalLevel: number): TalentGrade {
    let result = TalentGrade.DISCIPLE;
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

  getGradeStatBonus(currentGrade: TalentGrade): Stats {
    let atk = 0;
    let def = 0;
    const currentIdx = GRADE_ORDER.indexOf(currentGrade);
    for (const bonus of GRADE_STAT_BONUSES) {
      const bonusIdx = GRADE_ORDER.indexOf(bonus.grade);
      if (bonusIdx <= currentIdx) {
        if (bonus.stat === 'ATK') atk += bonus.amount;
        else if (bonus.stat === 'DEF') def += bonus.amount;
      }
    }
    return Stats.create({ atk, def });
  },

  getIndividualGradeBonus(grade: TalentGrade): { stat: string; amount: number } | null {
    return GRADE_STAT_BONUSES.find(b => b.grade === grade) ?? null;
  },

  isGradeThreshold(level: number): boolean {
    return GRADE_THRESHOLD_LEVELS.has(level);
  },

  getMilestonesInRange(fromLevel: number, toLevel: number): TalentMilestone[] {
    return MILESTONES.filter(m => m.level > fromLevel && m.level < toLevel);
  },

  getAllMilestones(): TalentMilestone[] {
    return MILESTONES;
  },
};
