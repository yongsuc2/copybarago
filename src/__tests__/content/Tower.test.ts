import { describe, it, expect } from 'vitest';
import { Tower } from '../../domain/content/Tower';
import { BattleUnit } from '../../domain/battle/BattleUnit';
import { Stats } from '../../domain/value-objects/Stats';
import { BattleState } from '../../domain/enums';

describe('Tower', () => {
  it('starts at floor 1 stage 1', () => {
    const tower = new Tower();
    expect(tower.currentFloor).toBe(1);
    expect(tower.currentStage).toBe(1);
  });

  it('creates a challenge battle', () => {
    const tower = new Tower();
    const player = new BattleUnit('Player', Stats.create({ hp: 500, maxHp: 500, atk: 50, def: 10 }), [], [], true);
    const result = tower.challenge(player, 1);

    expect(result.isOk()).toBe(true);
    expect(result.data?.battle).toBeDefined();
  });

  it('fails challenge without tokens', () => {
    const tower = new Tower();
    const player = new BattleUnit('Player', Stats.create({ hp: 500, maxHp: 500, atk: 50, def: 10 }), [], [], true);
    const result = tower.challenge(player, 0);

    expect(result.isFail()).toBe(true);
  });

  it('advances stage on victory', () => {
    const tower = new Tower();
    const result = tower.onBattleResult(BattleState.VICTORY);

    expect(result.advanced).toBe(true);
    expect(tower.currentStage).toBe(2);
  });

  it('does not advance on defeat and does not consume token', () => {
    const tower = new Tower();
    const result = tower.onBattleResult(BattleState.DEFEAT);

    expect(result.advanced).toBe(false);
    expect(result.tokenConsumed).toBe(false);
    expect(tower.currentStage).toBe(1);
  });

  it('advances floor after clearing all stages', () => {
    const tower = new Tower(1, 10);
    tower.onBattleResult(BattleState.VICTORY);

    expect(tower.currentFloor).toBe(2);
    expect(tower.currentStage).toBe(1);
  });

  it('gives power stone reward at stage 5 and 10', () => {
    const tower = new Tower();
    const r5 = tower.getReward(1, 5);
    const r10 = tower.getReward(1, 10);
    const r3 = tower.getReward(1, 3);

    expect(r5.resources.some(r => r.type === 'POWER_STONE')).toBe(true);
    expect(r10.resources.some(r => r.type === 'POWER_STONE')).toBe(true);
    expect(r3.resources.some(r => r.type === 'POWER_STONE')).toBe(false);
  });
});
