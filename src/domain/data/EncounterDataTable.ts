import { EncounterType, ChapterType } from '../enums';

interface EncounterWeight {
  type: EncounterType;
  weight: number;
}

interface EncounterTypeInfo {
  label: string;
  description: string;
}

const TYPE_INFO: Record<EncounterType, EncounterTypeInfo> = {
  [EncounterType.ANGEL]: { label: '천사', description: '천사가 나타나 스킬이나 회복을 제공합니다.' },
  [EncounterType.DEMON]: { label: '악마', description: '악마가 체력을 대가로 강력한 스킬을 제안합니다.' },
  [EncounterType.CHANCE]: { label: '우연', description: '행운의 이벤트가 발생했습니다!' },
  [EncounterType.COMBAT]: { label: '전투', description: '적과 조우했습니다.' },
  [EncounterType.JUNGBAK_ROULETTE]: { label: '중박 룰렛', description: '중박이 12회 누적되어 특별 보상 룰렛이 발동합니다!' },
  [EncounterType.DAEBAK_ROULETTE]: { label: '대박 룰렛', description: '대박이 7회 누적되어 전설적인 룰렛이 발동합니다!' },
};

const WEIGHTS: Record<ChapterType, EncounterWeight[]> = {
  [ChapterType.SIXTY_DAY]: [
    { type: EncounterType.COMBAT, weight: 40 },
    { type: EncounterType.ANGEL, weight: 25 },
    { type: EncounterType.DEMON, weight: 15 },
    { type: EncounterType.CHANCE, weight: 20 },
  ],
  [ChapterType.THIRTY_DAY]: [
    { type: EncounterType.COMBAT, weight: 40 },
    { type: EncounterType.ANGEL, weight: 25 },
    { type: EncounterType.DEMON, weight: 15 },
    { type: EncounterType.CHANCE, weight: 20 },
  ],
  [ChapterType.FIVE_DAY]: [
    { type: EncounterType.COMBAT, weight: 70 },
    { type: EncounterType.ANGEL, weight: 20 },
    { type: EncounterType.CHANCE, weight: 10 },
  ],
};

const ANGEL = {
  healPercent: 0.3,
  healLabel: '체력 30% 회복',
  healDescription: '전투 중 잃은 체력을 회복합니다',
  skillLabel: (icon: string, name: string) => `${icon} ${name}`,
  skillDescription: (desc: string) => desc,
};

const DEMON = {
  hpCostPercent: 0.2,
  skillLabel: (icon: string, name: string) => `${icon} ${name}`,
  skillDescription: (desc: string) => `체력 20% 소모 | ${desc}`,
  rejectLabel: '거절',
  rejectDescription: '안전하게 떠나기',
};

const CHANCE = {
  boxGoldMin: 100,
  boxGoldMax: 300,
  boxLabel: '상자 열기',
  boxDescription: '골드 획득',
  springHealPercent: 0.5,
  springLabel: '치유의 샘',
  springDescription: '최대 체력의 50% 회복',
  blessingGold: 200,
  blessingLabel: '축복',
  blessingDescription: '골드 200 획득',
};

const JUNGBAK_ROULETTE = {
  healPercent: 0.5,
  healLabel: '체력 회복',
  healDescription: '최대 체력의 50% 회복',
  skillLabel: (icon: string, name: string) => `${icon} ${name}`,
  skillDescription: (desc: string) => desc,
  goldAmount: 500,
  goldLabel: '골드 보상',
  goldDescription: '골드 500 획득',
};

const DAEBAK_ROULETTE = {
  normalRate: 0.8,
  jackpotRate: 0.3,
  normalLabel: '일반 돌리기',
  normalDescription: '80% 확률로 신화 스킬 획득',
  jackpotLabel: '대박 돌리기',
  jackpotDescription: '30% 확률로 불멸 스킬 획득',
  skipLabel: '건너뛰기',
  skipDescription: '그냥 지나가기',
};

const COMBAT = {
  fightLabel: '전투',
  fightDescription: '전투에 돌입',
  avoidLabel: '회피',
  avoidDescription: '이번 전투 건너뛰기',
};

const COUNTER_THRESHOLD = {
  jungbak: 12,
  daebak: 7,
};

const FORCED_BATTLE_DAYS = {
  elite: 20,
  midBoss: 30,
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
  chance: CHANCE,
  jungbakRoulette: JUNGBAK_ROULETTE,
  daebakRoulette: DAEBAK_ROULETTE,
  combat: COMBAT,
  counterThreshold: COUNTER_THRESHOLD,
  forcedBattleDays: FORCED_BATTLE_DAYS,
};
