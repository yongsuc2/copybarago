import { EquipmentGrade, SlotType } from '../enums';
import type { SeededRandom } from '../../infrastructure/SeededRandom';
import data from './json/equipment-substats.data.json';

export interface SubStat {
  stat: string;
  value: number;
}

interface PoolEntry {
  stat: string;
  values: Record<string, [number, number]>;
}

const SUBSTAT_COUNT = data.substatCountByGrade as Record<EquipmentGrade, number>;
const POOLS = data.pools as Record<string, PoolEntry[]>;

export const EquipmentSubStatTable = {
  getSubStatCount(grade: EquipmentGrade): number {
    return SUBSTAT_COUNT[grade] ?? 0;
  },

  getPool(slot: SlotType): PoolEntry[] {
    return POOLS[slot] ?? [];
  },

  rollSubStat(slot: SlotType, grade: EquipmentGrade, rng: SeededRandom): SubStat {
    const pool = POOLS[slot];
    const entry = pool[rng.nextInt(0, pool.length - 1)];
    const range = entry.values[grade];
    const value = entry.stat === 'CRIT'
      ? Math.round((rng.nextFloat(range[0], range[1])) * 1000) / 1000
      : rng.nextInt(range[0], range[1]);
    return { stat: entry.stat, value };
  },

  rollSubStats(slot: SlotType, grade: EquipmentGrade, count: number, rng: SeededRandom): SubStat[] {
    const result: SubStat[] = [];
    for (let i = 0; i < count; i++) {
      result.push(this.rollSubStat(slot, grade, rng));
    }
    return result;
  },

  rollNewSubStats(slot: SlotType, grade: EquipmentGrade, rng: SeededRandom): SubStat[] {
    const count = this.getSubStatCount(grade);
    return this.rollSubStats(slot, grade, count, rng);
  },
};
