import { EncounterType, ChapterType, SkillGrade } from '../enums';

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
  [EncounterType.MERCHANT]: { label: '상인', description: '떠돌이 상인이 스킬을 판매합니다.' },
  [EncounterType.ROULETTE]: { label: '룰렛', description: '신비한 룰렛이 나타났습니다. 운을 시험해 보세요!' },
  [EncounterType.LUCKY_MACHINE]: { label: '행운머신', description: '행운의 머신이 나타났습니다. 위험할수록 보상이 큽니다!' },
};

const WEIGHTS: Record<ChapterType, EncounterWeight[]> = {
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

const ANGEL = {
  healPercent: 0.3,
  healLabel: '체력 30% 회복',
  healDescription: '최대 체력의 30% 회복',
  skillLabel: (icon: string, name: string) => `획득: ${icon} ${name}`,
  skillDescription: (icon: string, name: string) => `${icon} ${name} 스킬 획득`,
};

const DEMON = {
  hpCostPercent: 0.2,
  skillLabel: (icon: string, name: string) => `희생: ${icon} ${name}`,
  skillDescription: (icon: string, name: string) => `최대 체력 20% 소모, ${icon} ${name} 획득`,
  rejectLabel: '거절',
  rejectDescription: '안전하게 떠나기',
};

const MERCHANT = {
  prices: { [SkillGrade.LEGENDARY]: 300, default: 150 } as Record<string, number>,
  getPrice(grade: SkillGrade): number {
    return this.prices[grade] ?? this.prices.default;
  },
  buyLabel: (icon: string, name: string, price: number) => `구매: ${icon} ${name} (${price}g)`,
  buyDescription: (icon: string, name: string, price: number) => `${icon} ${name}을(를) ${price} 골드에 구매`,
  leaveLabel: '떠나기',
  leaveDescription: '상인을 떠나기',
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

const ROULETTE = {
  normalRate: 0.8,
  jackpotRate: 0.3,
  normalLabel: '일반 돌리기',
  normalDescription: '80% 확률로 신화 스킬 획득',
  jackpotLabel: '대박 돌리기',
  jackpotDescription: '30% 확률로 불멸 스킬 획득',
  skipLabel: '건너뛰기',
  skipDescription: '그냥 지나가기',
};

const LUCKY_MACHINE = {
  baseGold: 500,
  safeMultiplier: 0.5,
  safeRate: 1.0,
  safeLabel: (gold: number) => `안전 머신 (100%)`,
  safeDescription: (gold: number) => `100% 확률, ${gold}골드 획득`,
  normalRate: 0.7,
  normalLabel: (gold: number) => `일반 머신 (70%)`,
  normalDescription: (gold: number) => `70% 확률, ${gold}골드 획득`,
  riskyMultiplier: 2,
  riskyRate: 0.4,
  riskyLabel: (gold: number) => `위험 머신 (40%)`,
  riskyDescription: (gold: number) => `40% 확률, ${gold}골드 획득`,
};

const COMBAT = {
  fightLabel: '전투',
  fightDescription: '전투에 돌입',
  avoidLabel: '회피',
  avoidDescription: '이번 전투 건너뛰기',
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
  merchant: MERCHANT,
  chance: CHANCE,
  roulette: ROULETTE,
  luckyMachine: LUCKY_MACHINE,
  combat: COMBAT,
};
