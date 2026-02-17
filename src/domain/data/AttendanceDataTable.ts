import { ResourceType, PetGrade } from '../enums';
import rawData from './json/attendance.data.json';

export type AttendanceRewardType = 'RESOURCE' | 'PET' | 'EQUIPMENT_GACHA';

export interface AttendanceRewardDef {
  day: number;
  type: AttendanceRewardType;
  resources?: { type: ResourceType; amount: number }[];
  petGrade?: PetGrade;
  description: string;
}

const REWARDS: AttendanceRewardDef[] = rawData.map(r => ({
  day: r.day,
  type: r.type as AttendanceRewardType,
  resources: r.resources?.map(res => ({ type: res.type as ResourceType, amount: res.amount })),
  petGrade: r.petGrade as PetGrade | undefined,
  description: r.description,
}));

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
