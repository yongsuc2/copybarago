import { StatType, TalentGrade, ResourceType } from '../enums';
import data from './json/talent.data.json';

const STAT_PER_LEVEL = data.statPerLevel as Record<StatType, number>;
const GRADE_THRESHOLDS = data.gradeThresholds as { grade: TalentGrade; totalLevel: number }[];
const GRADE_ORDER = data.gradeOrder as TalentGrade[];

export interface TalentMilestone {
  fromGrade: TalentGrade;
  percent: number;
  rewardType: ResourceType;
  rewardAmount: number;
}

const MILESTONES = data.gradeMilestones as TalentMilestone[];

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

  getMilestonesForGrade(grade: TalentGrade): TalentMilestone[] {
    return MILESTONES.filter(m => m.fromGrade === grade);
  },

  getMilestoneLevel(fromGrade: TalentGrade, percent: number): number {
    const start = this.getGradeStartLevel(fromGrade);
    const end = this.getNextGradeThreshold(fromGrade);
    if (end === null) return start;
    return start + Math.ceil((end - start) * percent / 100);
  },

  getAllMilestones(): TalentMilestone[] {
    return MILESTONES;
  },
};
