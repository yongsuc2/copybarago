import { StatType, TalentGrade } from '../enums';
import data from './json/talent.data.json';

const STAT_PER_LEVEL = data.statPerLevel as Record<StatType, number>;
const GRADE_THRESHOLDS = data.gradeThresholds as { grade: TalentGrade; totalLevel: number }[];
const GRADE_ORDER = data.gradeOrder as TalentGrade[];

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
};
