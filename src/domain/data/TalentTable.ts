import { StatType, TalentGrade } from '../enums';

const STAT_PER_LEVEL: Record<StatType, number> = {
  [StatType.HP]: 20,
  [StatType.ATK]: 5,
  [StatType.DEF]: 3,
  [StatType.CRIT]: 0,
};

const BASE_UPGRADE_COST = 100;
const COST_GROWTH_RATE = 1.15;

const GRADE_THRESHOLDS: { grade: TalentGrade; totalLevel: number }[] = [
  { grade: TalentGrade.DISCIPLE, totalLevel: 0 },
  { grade: TalentGrade.ADVENTURER, totalLevel: 30 },
  { grade: TalentGrade.ELITE, totalLevel: 90 },
  { grade: TalentGrade.MASTER, totalLevel: 200 },
  { grade: TalentGrade.WARRIOR, totalLevel: 400 },
  { grade: TalentGrade.HERO, totalLevel: 700 },
];

const GRADE_ORDER: TalentGrade[] = [
  TalentGrade.DISCIPLE,
  TalentGrade.ADVENTURER,
  TalentGrade.ELITE,
  TalentGrade.MASTER,
  TalentGrade.WARRIOR,
  TalentGrade.HERO,
];

export const TalentTable = {
  getStatPerLevel(statType: StatType): number {
    return STAT_PER_LEVEL[statType];
  },

  getUpgradeCost(level: number): number {
    return Math.floor(BASE_UPGRADE_COST * Math.pow(COST_GROWTH_RATE, level));
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
