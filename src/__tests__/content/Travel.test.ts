import { describe, it, expect } from 'vitest';
import { Travel } from '../../domain/content/Travel';

describe('Travel', () => {
  it('calculates gold based on chapter and multiplier', () => {
    const travel = new Travel(5);
    travel.setMultiplier(3);

    const gold = travel.calculateGold(10);
    expect(gold).toBeGreaterThan(0);

    travel.setMultiplier(10);
    const gold10x = travel.calculateGold(10);
    expect(gold10x).toBeGreaterThan(gold);
  });

  it('runs and returns reward', () => {
    const travel = new Travel(3);
    const result = travel.run(20, 50);

    expect(result.isOk()).toBe(true);
    expect(result.data?.staminaSpent).toBe(20);
    expect(result.data?.reward.resources.length).toBeGreaterThan(0);
  });

  it('fails with insufficient stamina', () => {
    const travel = new Travel(3);
    const result = travel.run(20, 10);

    expect(result.isFail()).toBe(true);
  });

  it('rejects invalid multipliers', () => {
    const travel = new Travel(1);
    const result = travel.setMultiplier(7);
    expect(result.isFail()).toBe(true);
  });

  it('accepts valid multipliers', () => {
    const travel = new Travel(1);
    expect(travel.setMultiplier(3).isOk()).toBe(true);
    expect(travel.setMultiplier(50).isOk()).toBe(true);
  });

  it('preview matches actual calculation', () => {
    const travel = new Travel(5);
    travel.setMultiplier(10);
    expect(travel.getGoldPreview(30)).toBe(travel.calculateGold(30));
  });
});
