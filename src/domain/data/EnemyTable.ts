import { Stats } from '../value-objects/Stats';
import { BattleDataTable } from './BattleDataTable';
import data from './json/enemy.data.json';

export interface EnemyTemplateData {
  id: string;
  name: string;
  baseStats: Stats;
  skillIds: string[];
  isBoss: boolean;
  ragePerAttack?: number;
}

const BASE_ENEMY_STATS = Stats.create(data.baseStats.enemy);
const BASE_ELITE_STATS = Stats.create(data.baseStats.elite);
const BASE_BOSS_STATS = Stats.create(data.baseStats.boss);

const SCALING_PER_CHAPTER = BattleDataTable.enemy.scalingPerChapter;
const TOWER_SCALING_PER_FLOOR = BattleDataTable.enemy.scalingPerTowerFloor;

const ENEMY_TEMPLATES: EnemyTemplateData[] = data.templates.map(t => ({
  id: t.id,
  name: t.name,
  baseStats: Stats.create({ hp: t.hp, maxHp: t.hp, atk: t.atk, def: t.def, crit: t.crit }),
  skillIds: t.skillIds,
  isBoss: t.isBoss,
  ragePerAttack: t.ragePerAttack,
}));

const CHAPTER_ENEMY_POOL = data.pools.enemy;
const CHAPTER_ELITE_POOL = data.pools.elite;
const CHAPTER_BOSS_POOL = data.pools.boss;

export const EnemyTable = {
  getTemplate(id: string): EnemyTemplateData | undefined {
    return ENEMY_TEMPLATES.find(e => e.id === id);
  },

  getScaledStats(baseStats: Stats, chapterLevel: number): Stats {
    const factor = Math.pow(SCALING_PER_CHAPTER, chapterLevel - 1);
    return baseStats.multiply(factor);
  },

  getTowerScaledStats(baseStats: Stats, floor: number): Stats {
    const factor = Math.pow(TOWER_SCALING_PER_FLOOR, floor - 1);
    return baseStats.multiply(factor);
  },

  getRandomEnemyId(): string {
    return CHAPTER_ENEMY_POOL[Math.floor(Math.random() * CHAPTER_ENEMY_POOL.length)];
  },

  getRandomEliteId(): string {
    return CHAPTER_ELITE_POOL[Math.floor(Math.random() * CHAPTER_ELITE_POOL.length)];
  },

  getRandomBossId(): string {
    return CHAPTER_BOSS_POOL[Math.floor(Math.random() * CHAPTER_BOSS_POOL.length)];
  },

  getChapterEnemyPool(): string[] {
    return CHAPTER_ENEMY_POOL;
  },

  getChapterBossPool(): string[] {
    return CHAPTER_BOSS_POOL;
  },

  getBaseEnemyStats(): Stats {
    return BASE_ENEMY_STATS;
  },

  getBaseBossStats(): Stats {
    return BASE_BOSS_STATS;
  },
};
