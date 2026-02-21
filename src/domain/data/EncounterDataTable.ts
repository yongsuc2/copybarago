import { EncounterType, ChapterType } from '../enums';
import data from './json/encounter.data.json';

interface EncounterWeight {
  type: EncounterType;
  weight: number;
}

interface EncounterTypeInfo {
  label: string;
  description: string;
}

const TYPE_INFO = data.typeInfo as Record<EncounterType, EncounterTypeInfo>;
const WEIGHTS = data.weights as Record<ChapterType, EncounterWeight[]>;

const ANGEL = {
  ...data.angel,
  skillLabel: (icon: string, name: string) => `${icon} ${name}`,
  skillDescription: (desc: string) => desc,
};

const DEMON = {
  ...data.demon,
  skillLabel: (icon: string, name: string) => `${icon} ${name}`,
  skillDescription: (desc: string) => `체력 20% 소모 | ${desc}`,
};

const JUNGBAK_ROULETTE = {
  ...data.jungbakRoulette,
  skillLabel: (icon: string, name: string) => `${icon} ${name}`,
  skillDescription: (desc: string) => desc,
};

export const EncounterDataTable = {
  getTypeInfo(type: EncounterType): EncounterTypeInfo {
    return TYPE_INFO[type];
  },
  getLabel(type: EncounterType): string {
    return TYPE_INFO[type].label;
  },
  getDescription(type: EncounterType): string {
    return TYPE_INFO[type].description;
  },
  getWeights(chapterType: ChapterType): EncounterWeight[] {
    return WEIGHTS[chapterType];
  },
  angel: ANGEL,
  demon: DEMON,
  chance: data.chance,
  jungbakRoulette: JUNGBAK_ROULETTE,
  daebakRoulette: data.daebakRoulette,
  combat: data.combat,
  counterThreshold: data.counterThreshold,
  forcedBattleDays: data.forcedBattleDays,
  optionalEliteDays: data.optionalEliteDays as { day: number; chance: number }[],
  chapterClearReward: data.chapterClearReward,
  getChapterClearGold(chapterId: number): number {
    return data.chapterClearReward.goldBase + data.chapterClearReward.goldPerChapter * chapterId;
  },
  getChapterClearGems(chapterId: number): number {
    return data.chapterClearReward.gemsBase + data.chapterClearReward.gemsPerChapter * chapterId;
  },
  getChapterBossAssignment(chapterId: number): { elite: string; midBoss: string; boss: string } {
    const assignments = data.chapterBossAssignment;
    return assignments[(chapterId - 1) % assignments.length];
  },
};
