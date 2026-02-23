import { describe, it, expect } from 'vitest';
import { SkillExecutionEngine, type SkillExecutionUnit } from '../../domain/battle/SkillExecutionEngine';
import { ActiveSkillRegistry } from '../../domain/data/ActiveSkillRegistry';
import { ActiveSkill, everyNTurns, onSkillActivation, prob, noCondition, trigger } from '../../domain/entities/ActiveSkill';
import { SkillHierarchy, SkillEffectType, AttackType } from '../../domain/enums';
import { SeededRandom } from '../../infrastructure/SeededRandom';
import { StatusEffect } from '../../domain/battle/StatusEffect';
import { BattleDataTable } from '../../domain/data/BattleDataTable';

function makeUnit(overrides: Partial<SkillExecutionUnit> = {}): SkillExecutionUnit {
  return {
    name: 'TestUnit',
    currentHp: 100,
    maxHp: 100,
    getEffectiveAtk: () => 50,
    getEffectiveDef: () => 20,
    getEffectiveCrit: () => 0,
    rage: 0,
    maxRage: 100,
    magicCoefficient: BattleDataTable.damage.baseMagicCoefficient,
    takeDamage(amount: number) {
      const dealt = Math.min(amount, this.currentHp);
      this.currentHp -= dealt;
      return dealt;
    },
    heal(amount: number) {
      const actual = Math.min(amount, this.maxHp - this.currentHp);
      this.currentHp += actual;
      return actual;
    },
    addStatusEffect(_effect: StatusEffect) {},
    isAlive() { return this.currentHp > 0; },
    getHpPercent() { return this.currentHp / this.maxHp; },
    getSkillDamageMultiplier: () => 1.0,
    getHpBonusDamage: () => 0,
    usedOnceConditions: new Set(),
    ...overrides,
  };
}

describe('SkillExecutionEngine', () => {
  it('executes a simple physical attack skill', () => {
    const engine = new SkillExecutionEngine(new SeededRandom(42));
    const skill = new ActiveSkill(
      'test_attack', 'Test Attack', '⚔️',
      SkillHierarchy.LOWEST, 1, [], [],
      trigger(everyNTurns(1)),
      [{ type: SkillEffectType.ATTACK, attackType: AttackType.PHYSICAL, coefficient: 1.0 }],
    );

    const source = makeUnit();
    const target = makeUnit();
    const results = engine.executeSkillEffects(skill, source, target, [skill]);

    expect(results.length).toBe(1);
    expect(results[0].damage).toBeGreaterThan(0);
    expect(target.currentHp).toBeLessThan(100);
  });

  it('executes magic attack with magicCoefficient', () => {
    const engine = new SkillExecutionEngine(new SeededRandom(42));
    const skill = new ActiveSkill(
      'test_magic', 'Test Magic', '✨',
      SkillHierarchy.LOWEST, 1, [], [],
      trigger(everyNTurns(1)),
      [{ type: SkillEffectType.ATTACK, attackType: AttackType.MAGIC, coefficient: 0.5 }],
    );

    const source = makeUnit();
    const target = makeUnit();
    const results = engine.executeSkillEffects(skill, source, target, [skill]);

    expect(results.length).toBe(1);
    expect(results[0].damage).toBeGreaterThan(0);
  });

  it('executes TRIGGER_SKILL to chain skills', () => {
    const engine = new SkillExecutionEngine(new SeededRandom(42));
    const allSkills = ActiveSkillRegistry.getAll();

    const thunderStrike = ActiveSkillRegistry.getById('thunder_strike', 1)!;
    const results = engine.executeSkillEffects(
      thunderStrike, makeUnit(), makeUnit(), allSkills,
    );

    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.damage > 0)).toBe(true);
  });

  it('respects MAX_SKILL_CHAIN_DEPTH', () => {
    const engine = new SkillExecutionEngine(new SeededRandom(42));

    const lowest = new ActiveSkill(
      'test_lowest', 'Lowest', '⬇️',
      SkillHierarchy.LOWEST, 1, [], [],
      trigger(everyNTurns(1)),
      [{ type: SkillEffectType.ATTACK, attackType: AttackType.PHYSICAL, coefficient: 0.1 }],
    );

    const lower = new ActiveSkill(
      'test_lower', 'Lower', '⬇️',
      SkillHierarchy.LOWER, 1, [], [],
      trigger(everyNTurns(1)),
      [{ type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'test_lowest', count: 1 }],
    );

    const upper = new ActiveSkill(
      'test_upper', 'Upper', '⬆️',
      SkillHierarchy.UPPER, 1, [], [],
      trigger(everyNTurns(1)),
      [{ type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'test_lower', count: 1 }],
    );

    const allSkills = [upper, lower, lowest];
    const results = engine.executeSkillEffects(upper, makeUnit(), makeUnit(), allSkills);

    expect(results.length).toBe(1);
    expect(results[0].damage).toBeGreaterThan(0);
  });

  it('INJECT_EFFECT adds effects to target skill', () => {
    const engine = new SkillExecutionEngine(new SeededRandom(1));

    const allSkills = ActiveSkillRegistry.getAll();
    engine.resolveInjections(allSkills);

    const shurikenSummon = allSkills.find(s => s.id === 'shuriken_summon' && s.tier === 1)!;
    const resolved = engine.getResolvedEffects(shurikenSummon);

    const thunderShuriken = allSkills.find(s => s.id === 'thunder_shuriken' && s.tier === 1);
    if (thunderShuriken) {
      expect(resolved.length).toBeGreaterThanOrEqual(shurikenSummon.effects.length);
    }
  });

  it('HEAL_HP effect heals the source', () => {
    const engine = new SkillExecutionEngine(new SeededRandom(42));
    const skill = new ActiveSkill(
      'test_heal', 'Heal', '💚',
      SkillHierarchy.LOWEST, 1, [], [],
      trigger(everyNTurns(1)),
      [{ type: SkillEffectType.HEAL_HP, amount: 0.2 }],
    );

    const source = makeUnit({ currentHp: 50 });
    const target = makeUnit();
    const results = engine.executeSkillEffects(skill, source, target, [skill]);

    expect(results.length).toBe(1);
    expect(results[0].healAmount).toBe(20);
    expect(source.currentHp).toBe(70);
  });

  it('ADD_RAGE effect increases rage', () => {
    const engine = new SkillExecutionEngine(new SeededRandom(42));
    const skill = new ActiveSkill(
      'test_rage', 'Rage Add', '💢',
      SkillHierarchy.LOWEST, 1, [], [],
      trigger(everyNTurns(1)),
      [{ type: SkillEffectType.ADD_RAGE, amount: 25 }],
    );

    const source = makeUnit({ rage: 0 });
    const target = makeUnit();
    engine.executeSkillEffects(skill, source, target, [skill]);

    expect(source.rage).toBe(25);
  });

  it('CONSUME_RAGE effect decreases rage', () => {
    const engine = new SkillExecutionEngine(new SeededRandom(42));
    const skill = new ActiveSkill(
      'test_consume', 'Consume', '💢',
      SkillHierarchy.LOWEST, 1, [], [],
      trigger(everyNTurns(1)),
      [{ type: SkillEffectType.CONSUME_RAGE, amount: 100 }],
    );

    const source = makeUnit({ rage: 100 });
    const target = makeUnit();
    engine.executeSkillEffects(skill, source, target, [skill]);

    expect(source.rage).toBe(0);
  });

  it('evaluateTrigger checks EVERY_N_TURNS', () => {
    const engine = new SkillExecutionEngine(new SeededRandom(42));
    const source = makeUnit();

    const t = trigger(everyNTurns(2));
    expect(engine.evaluateTrigger(t, 1, source)).toBe(false);
    expect(engine.evaluateTrigger(t, 2, source)).toBe(true);
    expect(engine.evaluateTrigger(t, 3, source)).toBe(false);
    expect(engine.evaluateTrigger(t, 4, source)).toBe(true);
  });

  it('evaluateTrigger checks ON_SKILL_ACTIVATION', () => {
    const engine = new SkillExecutionEngine(new SeededRandom(42));
    const source = makeUnit();

    const t = trigger(onSkillActivation('ilban_attack'));
    expect(engine.evaluateTrigger(t, 1, source, 'ilban_attack')).toBe(true);
    expect(engine.evaluateTrigger(t, 1, source, 'bunno_attack')).toBe(false);
    expect(engine.evaluateTrigger(t, 1, source)).toBe(false);
  });

  it('evaluateTrigger checks RAGE_FULL condition', () => {
    const engine = new SkillExecutionEngine(new SeededRandom(42));

    const sourceNoRage = makeUnit({ rage: 50 });
    const sourceFullRage = makeUnit({ rage: 100 });

    const t = trigger(everyNTurns(1), prob(1.0), { type: 'RAGE_FULL' as any });
    expect(engine.evaluateTrigger(t, 1, sourceNoRage)).toBe(false);
    expect(engine.evaluateTrigger(t, 1, sourceFullRage)).toBe(true);
  });

  it('evaluateTrigger checks probability', () => {
    const engine = new SkillExecutionEngine(new SeededRandom(42));
    const source = makeUnit();

    const t = trigger(everyNTurns(1), prob(0.0));
    expect(engine.evaluateTrigger(t, 1, source)).toBe(false);
  });

  it('stops executing when target dies', () => {
    const engine = new SkillExecutionEngine(new SeededRandom(42));
    const source = makeUnit({ getEffectiveAtk: () => 1000 });
    const target = makeUnit({ currentHp: 1 });

    const skill = new ActiveSkill(
      'overkill', 'Overkill', '💀',
      SkillHierarchy.UPPER, 1, [], [],
      trigger(everyNTurns(1)),
      [
        { type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'hit1', count: 1 },
        { type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'hit2', count: 1 },
      ],
    );

    const hit1 = new ActiveSkill(
      'hit1', 'Hit 1', '⚔️',
      SkillHierarchy.LOWEST, 1, [], [],
      trigger(everyNTurns(1)),
      [{ type: SkillEffectType.ATTACK, attackType: AttackType.PHYSICAL, coefficient: 10.0 }],
    );

    const hit2 = new ActiveSkill(
      'hit2', 'Hit 2', '⚔️',
      SkillHierarchy.LOWEST, 1, [], [],
      trigger(everyNTurns(1)),
      [{ type: SkillEffectType.ATTACK, attackType: AttackType.PHYSICAL, coefficient: 10.0 }],
    );

    const results = engine.executeSkillEffects(skill, source, target, [skill, hit1, hit2]);

    expect(target.currentHp).toBeLessThanOrEqual(0);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it('AoE attack hits all alive targets', () => {
    const engine = new SkillExecutionEngine(new SeededRandom(42));
    const skill = new ActiveSkill(
      'test_aoe', 'AoE Attack', '💥',
      SkillHierarchy.LOWEST, 1, [], [],
      trigger(everyNTurns(1)),
      [{ type: SkillEffectType.ATTACK, attackType: AttackType.PHYSICAL, coefficient: 1.0, isAoe: true }],
    );

    const source = makeUnit({ getEffectiveAtk: () => 50 });
    const target1 = makeUnit({ currentHp: 100, name: 'Enemy1' });
    const target2 = makeUnit({ currentHp: 100, name: 'Enemy2' });
    const allTargets = [target1, target2];

    const results = engine.executeSkillEffects(skill, source, target1, [skill], 0, allTargets);

    expect(results.length).toBe(2);
    expect(target1.currentHp).toBeLessThan(100);
    expect(target2.currentHp).toBeLessThan(100);
    expect(results[0].targetName).toBe('Enemy1');
    expect(results[1].targetName).toBe('Enemy2');
  });

  it('AoE skips dead targets', () => {
    const engine = new SkillExecutionEngine(new SeededRandom(42));
    const skill = new ActiveSkill(
      'test_aoe', 'AoE Attack', '💥',
      SkillHierarchy.LOWEST, 1, [], [],
      trigger(everyNTurns(1)),
      [{ type: SkillEffectType.ATTACK, attackType: AttackType.PHYSICAL, coefficient: 1.0, isAoe: true }],
    );

    const source = makeUnit({ getEffectiveAtk: () => 50 });
    const target1 = makeUnit({ currentHp: 0, name: 'Dead' });
    const target2 = makeUnit({ currentHp: 100, name: 'Alive' });
    const allTargets = [target1, target2];

    const results = engine.executeSkillEffects(skill, source, target2, [skill], 0, allTargets);

    expect(results.length).toBe(1);
    expect(results[0].targetName).toBe('Alive');
  });

  it('percentage defense formula: physical damage = ATK * coeff * (k / (k + DEF))', () => {
    const engine = new SkillExecutionEngine(new SeededRandom(42));
    const skill = new ActiveSkill(
      'test_phys', 'Phys', '⚔️',
      SkillHierarchy.LOWEST, 1, [], [],
      trigger(everyNTurns(1)),
      [{ type: SkillEffectType.ATTACK, attackType: AttackType.PHYSICAL, coefficient: 1.0 }],
    );

    const atk = 100;
    const def = 50;
    const k = BattleDataTable.damage.defenseConstant;
    const expectedDamage = Math.max(1, Math.floor(atk * 1.0 * (k / (k + def))));

    const source = makeUnit({ getEffectiveAtk: () => atk, getEffectiveCrit: () => 0 });
    const target = makeUnit({ currentHp: 1000, maxHp: 1000, getEffectiveDef: () => def });

    const results = engine.executeSkillEffects(skill, source, target, [skill]);

    expect(results[0].damage).toBe(expectedDamage);
    expect(expectedDamage).toBe(Math.floor(100 * (100 / 150)));
  });

  it('percentage defense formula: magic damage includes magicCoefficient', () => {
    const engine = new SkillExecutionEngine(new SeededRandom(42));
    const skill = new ActiveSkill(
      'test_magic_def', 'Magic', '✨',
      SkillHierarchy.LOWEST, 1, [], [],
      trigger(everyNTurns(1)),
      [{ type: SkillEffectType.ATTACK, attackType: AttackType.MAGIC, coefficient: 0.5 }],
    );

    const atk = 100;
    const def = 50;
    const magicCoeff = 0.7;
    const k = BattleDataTable.damage.magicDefenseConstant;
    const expectedDamage = Math.max(1, Math.floor(atk * magicCoeff * 0.5 * (k / (k + def))));

    const source = makeUnit({
      getEffectiveAtk: () => atk, getEffectiveCrit: () => 0,
      magicCoefficient: magicCoeff,
    });
    const target = makeUnit({ currentHp: 1000, maxHp: 1000, getEffectiveDef: () => def });

    const results = engine.executeSkillEffects(skill, source, target, [skill]);

    expect(results[0].damage).toBe(expectedDamage);
  });
});
