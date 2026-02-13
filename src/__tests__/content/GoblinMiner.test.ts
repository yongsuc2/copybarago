import { describe, it, expect } from 'vitest';
import { GoblinMiner } from '../../domain/content/GoblinMiner';
import { SeededRandom } from '../../infrastructure/SeededRandom';

describe('GoblinMiner', () => {
  it('mines and gains ore', () => {
    const miner = new GoblinMiner();
    const result = miner.mine(1);
    expect(result.isOk()).toBe(true);
    expect(miner.oreCount).toBe(1);
  });

  it('fails to mine without pickaxes', () => {
    const miner = new GoblinMiner();
    const result = miner.mine(0);
    expect(result.isFail()).toBe(true);
  });

  it('cannot use cart before 30 ore', () => {
    const miner = new GoblinMiner(29);
    expect(miner.canUseCart()).toBe(false);
  });

  it('can use cart at 30 ore', () => {
    const miner = new GoblinMiner(30);
    expect(miner.canUseCart()).toBe(true);
  });

  it('uses cart and gets reward', () => {
    const miner = new GoblinMiner(30);
    const rng = new SeededRandom(42);
    const result = miner.useCart(rng);

    expect(result.isOk()).toBe(true);
    expect(miner.oreCount).toBe(0);
    expect(result.data?.reward.resources.length).toBeGreaterThan(0);
  });

  it('tracks progress correctly', () => {
    const miner = new GoblinMiner(15);
    expect(miner.getProgress()).toBeCloseTo(0.5);
    expect(miner.getOreNeeded()).toBe(15);
  });
});
