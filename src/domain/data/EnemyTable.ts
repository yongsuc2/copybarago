import { Stats } from '../value-objects/Stats';

export interface EnemyTemplateData {
  id: string;
  name: string;
  baseStats: Stats;
  skillIds: string[];
  isBoss: boolean;
  ragePerAttack?: number;
}

const BASE_ENEMY_STATS = Stats.create({ hp: 80, maxHp: 80, atk: 8, def: 3 });
const BASE_ELITE_STATS = Stats.create({ hp: 150, maxHp: 150, atk: 15, def: 6 });
const BASE_BOSS_STATS = Stats.create({ hp: 300, maxHp: 300, atk: 20, def: 10 });

const SCALING_PER_CHAPTER = 1.12;
const TOWER_SCALING_PER_FLOOR = 1.08;

const ENEMY_TEMPLATES: EnemyTemplateData[] = [
  { id: 'slime', name: 'Slime', baseStats: Stats.create({ hp: 60, maxHp: 60, atk: 6, def: 2 }), skillIds: [], isBoss: false, ragePerAttack: 25 },
  { id: 'goblin', name: 'Goblin', baseStats: Stats.create({ hp: 80, maxHp: 80, atk: 10, def: 3 }), skillIds: [], isBoss: false, ragePerAttack: 25 },
  { id: 'skeleton', name: 'Skeleton', baseStats: Stats.create({ hp: 100, maxHp: 100, atk: 12, def: 5 }), skillIds: ['poison_weapon'], isBoss: false, ragePerAttack: 25 },
  { id: 'orc', name: 'Orc', baseStats: Stats.create({ hp: 140, maxHp: 140, atk: 16, def: 7 }), skillIds: ['multi_hit_mastery'], isBoss: false, ragePerAttack: 25 },
  { id: 'dark_knight', name: 'Dark Knight', baseStats: Stats.create({ hp: 200, maxHp: 200, atk: 20, def: 10 }), skillIds: ['counter', 'iron_shield'], isBoss: false, ragePerAttack: 25 },

  { id: 'elite_wolf', name: 'Alpha Wolf', baseStats: BASE_ELITE_STATS, skillIds: ['multi_hit_mastery', 'counter'], isBoss: false, ragePerAttack: 25 },
  { id: 'elite_mage', name: 'Dark Mage', baseStats: Stats.create({ hp: 120, maxHp: 120, atk: 22, def: 4 }), skillIds: ['lightning'], isBoss: false, ragePerAttack: 25 },

  { id: 'boss_dragon', name: 'Ancient Dragon', baseStats: Stats.create({ hp: 500, maxHp: 500, atk: 25, def: 12 }), skillIds: ['lightning'], isBoss: true, ragePerAttack: 25 },
  { id: 'boss_demon', name: 'Demon Lord', baseStats: Stats.create({ hp: 400, maxHp: 400, atk: 30, def: 8 }), skillIds: ['poison_weapon', 'lifesteal'], isBoss: true, ragePerAttack: 25 },
  { id: 'boss_golem', name: 'Stone Golem', baseStats: Stats.create({ hp: 700, maxHp: 700, atk: 18, def: 20 }), skillIds: ['counter', 'iron_shield'], isBoss: true, ragePerAttack: 25 },
];

const CHAPTER_ENEMY_POOL = ['slime', 'goblin', 'skeleton', 'orc', 'dark_knight'];
const CHAPTER_ELITE_POOL = ['elite_wolf', 'elite_mage'];
const CHAPTER_BOSS_POOL = ['boss_dragon', 'boss_demon', 'boss_golem'];

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
