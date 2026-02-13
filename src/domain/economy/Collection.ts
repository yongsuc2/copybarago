import { Stats } from '../value-objects/Stats';

export interface CollectionEntry {
  id: string;
  name: string;
  bonusStats: Stats;
  acquired: boolean;
}

const COLLECTION_DATA: Omit<CollectionEntry, 'acquired'>[] = [
  { id: 'col_sword_1', name: 'Ancient Sword', bonusStats: Stats.create({ atk: 5 }) },
  { id: 'col_shield_1', name: 'Iron Shield', bonusStats: Stats.create({ def: 3 }) },
  { id: 'col_ring_1', name: 'Mystic Ring', bonusStats: Stats.create({ atk: 3, crit: 0.01 }) },
  { id: 'col_armor_1', name: 'Dragon Scale', bonusStats: Stats.create({ maxHp: 50, def: 2 }) },
  { id: 'col_gem_1', name: 'Star Gem', bonusStats: Stats.create({ atk: 2, maxHp: 20 }) },
  { id: 'col_crown_1', name: 'Golden Crown', bonusStats: Stats.create({ atk: 8 }) },
  { id: 'col_amulet_1', name: 'Shadow Amulet', bonusStats: Stats.create({ crit: 0.02 }) },
  { id: 'col_boots_1', name: 'Wind Boots', bonusStats: Stats.create({ atk: 4, def: 1 }) },
  { id: 'col_cape_1', name: 'Phoenix Cape', bonusStats: Stats.create({ maxHp: 80 }) },
  { id: 'col_orb_1', name: 'Thunder Orb', bonusStats: Stats.create({ atk: 6 }) },
];

export class Collection {
  entries: Map<string, CollectionEntry>;

  constructor() {
    this.entries = new Map();
    for (const data of COLLECTION_DATA) {
      this.entries.set(data.id, { ...data, acquired: false });
    }
  }

  acquire(id: string): boolean {
    const entry = this.entries.get(id);
    if (!entry || entry.acquired) return false;
    entry.acquired = true;
    return true;
  }

  isAcquired(id: string): boolean {
    return this.entries.get(id)?.acquired ?? false;
  }

  getTotalBonus(): Stats {
    let total = Stats.ZERO;
    for (const entry of this.entries.values()) {
      if (entry.acquired) {
        total = total.add(entry.bonusStats);
      }
    }
    return total;
  }

  getAcquiredCount(): number {
    let count = 0;
    for (const entry of this.entries.values()) {
      if (entry.acquired) count++;
    }
    return count;
  }

  getTotalCount(): number {
    return this.entries.size;
  }

  getProgress(): number {
    return this.getTotalCount() > 0 ? this.getAcquiredCount() / this.getTotalCount() : 0;
  }

  getAllEntries(): CollectionEntry[] {
    return [...this.entries.values()];
  }
}
