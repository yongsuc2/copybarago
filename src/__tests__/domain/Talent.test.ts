import { describe, it, expect } from 'vitest';
import { Talent } from '../../domain/entities/Talent';
import { StatType, TalentGrade } from '../../domain/enums';

describe('Talent', () => {
  it('starts at DISCIPLE grade with level 0', () => {
    const talent = new Talent();
    expect(talent.atkLevel).toBe(0);
    expect(talent.hpLevel).toBe(0);
    expect(talent.defLevel).toBe(0);
    expect(talent.grade).toBe(TalentGrade.DISCIPLE);
  });

  it('upgrades ATK with enough gold', () => {
    const talent = new Talent();
    const cost = talent.getUpgradeCost(StatType.ATK);
    const result = talent.upgrade(StatType.ATK, cost);

    expect(result.isOk()).toBe(true);
    expect(talent.atkLevel).toBe(1);
    expect(result.data?.newLevel).toBe(1);
  });

  it('fails upgrade with insufficient gold', () => {
    const talent = new Talent();
    const result = talent.upgrade(StatType.ATK, 0);

    expect(result.isFail()).toBe(true);
    expect(talent.atkLevel).toBe(0);
  });

  it('advances grade when total level reaches threshold', () => {
    const talent = new Talent(10, 10, 10);
    expect(talent.grade).toBe(TalentGrade.ADVENTURER);
  });

  it('computes stats from levels', () => {
    const talent = new Talent(5, 3, 2);
    const stats = talent.getStats();

    expect(stats.atk).toBe(25);
    expect(stats.maxHp).toBe(60);
    expect(stats.def).toBe(6);
  });

  it('reports next grade threshold', () => {
    const talent = new Talent();
    const threshold = talent.getNextGradeThreshold();
    expect(threshold).toBe(30);
  });

  it('detects grade change on upgrade', () => {
    const talent = new Talent(10, 10, 9);
    expect(talent.grade).toBe(TalentGrade.DISCIPLE);

    const cost = talent.getUpgradeCost(StatType.DEF);
    const result = talent.upgrade(StatType.DEF, cost + 10000);
    expect(result.data?.gradeChanged).toBe(true);
    expect(talent.grade).toBe(TalentGrade.ADVENTURER);
  });
});
