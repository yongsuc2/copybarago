import { ResourceType, PetGrade } from '../enums';

export type AttendanceRewardType = 'RESOURCE' | 'PET' | 'EQUIPMENT_GACHA';

export interface AttendanceRewardDef {
  day: number;
  type: AttendanceRewardType;
  resources?: { type: ResourceType; amount: number }[];
  petGrade?: PetGrade;
  description: string;
}

const REWARDS: AttendanceRewardDef[] = [
  { day: 1, type: 'RESOURCE', resources: [{ type: ResourceType.GEMS, amount: 50 }], description: '보석 50' },
  { day: 2, type: 'PET', petGrade: PetGrade.EPIC, description: '에픽 펫 (랜덤)' },
  { day: 3, type: 'EQUIPMENT_GACHA', description: '골드 장비뽑기 1회' },
  { day: 4, type: 'RESOURCE', resources: [{ type: ResourceType.GOLD, amount: 3000 }], description: '골드 3000' },
  { day: 5, type: 'RESOURCE', resources: [{ type: ResourceType.EQUIPMENT_STONE, amount: 5 }], description: '장비석 5' },
  { day: 6, type: 'RESOURCE', resources: [{ type: ResourceType.PET_EGG, amount: 2 }, { type: ResourceType.PET_FOOD, amount: 10 }], description: '펫 알 2 + 사료 10' },
  { day: 7, type: 'RESOURCE', resources: [{ type: ResourceType.GEMS, amount: 200 }], description: '보석 200' },
];

export const AttendanceDataTable = {
  getReward(day: number): AttendanceRewardDef | undefined {
    return REWARDS.find(r => r.day === day);
  },

  getAllRewards(): AttendanceRewardDef[] {
    return REWARDS;
  },

  getTotalDays(): number {
    return REWARDS.length;
  },
};
