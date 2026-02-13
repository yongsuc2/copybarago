import { describe, it, expect } from 'vitest';
import { Collection } from '../../domain/economy/Collection';

describe('Collection', () => {
  it('starts with no acquired entries', () => {
    const col = new Collection();
    expect(col.getAcquiredCount()).toBe(0);
    expect(col.getTotalCount()).toBeGreaterThan(0);
  });

  it('acquires entry and updates count', () => {
    const col = new Collection();
    const success = col.acquire('col_sword_1');

    expect(success).toBe(true);
    expect(col.getAcquiredCount()).toBe(1);
    expect(col.isAcquired('col_sword_1')).toBe(true);
  });

  it('cannot acquire same entry twice', () => {
    const col = new Collection();
    col.acquire('col_sword_1');
    const second = col.acquire('col_sword_1');

    expect(second).toBe(false);
    expect(col.getAcquiredCount()).toBe(1);
  });

  it('total bonus increases with acquisitions', () => {
    const col = new Collection();
    const before = col.getTotalBonus();
    expect(before.atk).toBe(0);

    col.acquire('col_sword_1');
    const after = col.getTotalBonus();
    expect(after.atk).toBeGreaterThan(0);
  });

  it('tracks progress percentage', () => {
    const col = new Collection();
    expect(col.getProgress()).toBe(0);

    const total = col.getTotalCount();
    const allEntries = col.getAllEntries();
    for (const entry of allEntries) {
      col.acquire(entry.id);
    }

    expect(col.getProgress()).toBe(1);
    expect(col.getAcquiredCount()).toBe(total);
  });
});
