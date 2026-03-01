import { describe, it, expect } from 'vitest';
import { SkillHierarchy, SkillEffectType, AttackType } from '../../domain/enums';
import { ActiveSkill, everyNTurns, onSkillActivation, prob, noCondition, trigger } from '../../domain/entities/ActiveSkill';
import { PassiveSkill } from '../../domain/entities/PassiveSkill';
import { PassiveType, StatType } from '../../domain/enums';
import { ActiveSkillRegistry } from '../../domain/data/ActiveSkillRegistry';
import { PassiveSkillRegistry } from '../../domain/data/PassiveSkillRegistry';
import { validateSkillHierarchy, MAX_SKILL_CHAIN_DEPTH } from '../../domain/battle/SkillValidator';

describe('SkillValidator', () => {
  it('validates all registered active skills pass hierarchy rules', () => {
    const allSkills = ActiveSkillRegistry.getAll();
    const errors = validateSkillHierarchy(allSkills);
    expect(errors).toEqual([]);
  });

  it('rejects LOWEST skill with TRIGGER_SKILL', () => {
    const badSkill = new ActiveSkill(
      'bad_lowest', 'Bad Lowest', '❌',
      SkillHierarchy.LOWEST, 1, [], [],
      trigger(everyNTurns(1)),
      [{ type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'lightning_summon', count: 1 }],
    );
    const allSkills = [...ActiveSkillRegistry.getAll(), badSkill];
    const errors = validateSkillHierarchy(allSkills);
    expect(errors.some(e => e.includes('LOWEST skill cannot have TRIGGER_SKILL'))).toBe(true);
  });

  it('rejects UPPER triggering UPPER', () => {
    const badSkill = new ActiveSkill(
      'bad_upper', 'Bad Upper', '❌',
      SkillHierarchy.UPPER, 1, [], [],
      trigger(everyNTurns(1)),
      [{ type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'thunder_strike', count: 1 }],
    );
    const allSkills = [...ActiveSkillRegistry.getAll(), badSkill];
    const errors = validateSkillHierarchy(allSkills);
    expect(errors.some(e => e.includes('cannot trigger'))).toBe(true);
  });

  it('rejects LOWER triggering LOWER', () => {
    const badLower = new ActiveSkill(
      'bad_lower', 'Bad Lower', '❌',
      SkillHierarchy.LOWER, 1, [], [],
      trigger(everyNTurns(1)),
      [{ type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'shuriken_summon', count: 1 }],
    );
    const allSkills = [...ActiveSkillRegistry.getAll(), badLower];
    const errors = validateSkillHierarchy(allSkills);
    expect(errors.some(e => e.includes('cannot trigger'))).toBe(true);
  });

  it('rejects self-referencing trigger', () => {
    const selfRef = new ActiveSkill(
      'self_ref', 'Self Ref', '❌',
      SkillHierarchy.UPPER, 1, [], [],
      trigger(everyNTurns(1)),
      [{ type: SkillEffectType.TRIGGER_SKILL, targetSkillId: 'self_ref', count: 1 }],
    );
    const allSkills = [...ActiveSkillRegistry.getAll(), selfRef];
    const errors = validateSkillHierarchy(allSkills);
    expect(errors.some(e => e.includes('self-reference'))).toBe(true);
  });

  it('rejects injection that violates hierarchy', () => {
    const badInject = new ActiveSkill(
      'bad_inject', 'Bad Inject', '❌',
      SkillHierarchy.UPPER, 1, [], [],
      trigger(everyNTurns(1)),
      [{
        type: SkillEffectType.INJECT_EFFECT,
        targetSkillId: 'shuriken_summon',
        injectedEffects: [{
          type: SkillEffectType.TRIGGER_SKILL,
          targetSkillId: 'shuriken_summon',
          count: 1,
        }],
      }],
    );
    const allSkills = [...ActiveSkillRegistry.getAll(), badInject];
    const errors = validateSkillHierarchy(allSkills);
    expect(errors.some(e => e.includes('illegally triggers'))).toBe(true);
  });

  it('accepts valid UPPER→LOWER→LOWEST chain', () => {
    const allSkills = ActiveSkillRegistry.getAll();
    const thunderShuriken = allSkills.find(s => s.id === 'thunder_shuriken' && s.tier === 1);
    expect(thunderShuriken).toBeDefined();
    expect(thunderShuriken!.hierarchy).toBe(SkillHierarchy.UPPER);

    const shurikenSummon = allSkills.find(s => s.id === 'shuriken_summon' && s.tier === 1);
    expect(shurikenSummon).toBeDefined();
    expect(shurikenSummon!.hierarchy).toBe(SkillHierarchy.LOWER);

    const lightningSummon = allSkills.find(s => s.id === 'lightning_summon' && s.tier === 1);
    expect(lightningSummon).toBeDefined();
    expect(lightningSummon!.hierarchy).toBe(SkillHierarchy.LOWEST);
  });

  it('MAX_SKILL_CHAIN_DEPTH is 3', () => {
    expect(MAX_SKILL_CHAIN_DEPTH).toBe(3);
  });
});

describe('ActiveSkillRegistry', () => {
  it('generates skills for all families with tiers', () => {
    const all = ActiveSkillRegistry.getAll();
    expect(all.length).toBeGreaterThan(0);

    const thunderShuriken1 = ActiveSkillRegistry.getById('thunder_shuriken', 1);
    expect(thunderShuriken1).toBeDefined();
    expect(thunderShuriken1!.name).toBe('번개 수리검');
    expect(thunderShuriken1!.tier).toBe(1);

    const thunderShuriken2 = ActiveSkillRegistry.getById('thunder_shuriken', 2);
    expect(thunderShuriken2).toBeDefined();
    expect(thunderShuriken2!.name).toBe('번개 수리검 II');
    expect(thunderShuriken2!.tier).toBe(2);
  });

  it('returns builtin skills', () => {
    const builtins = ActiveSkillRegistry.getBuiltinSkills();
    expect(builtins.length).toBe(2);
    const ids = builtins.map(s => s.id);
    expect(ids).toContain('ilban_attack');
    expect(ids).toContain('bunno_attack');
  });

  it('returns upper tier 1 skills', () => {
    const uppers = ActiveSkillRegistry.getUpperTier1Skills();
    expect(uppers.length).toBeGreaterThan(0);
    for (const s of uppers) {
      expect(s.hierarchy).toBe(SkillHierarchy.UPPER);
      expect(s.tier).toBe(1);
    }
  });

  it('getNextTier returns correct next tier', () => {
    const next = ActiveSkillRegistry.getNextTier('thunder_shuriken', 1);
    expect(next).toBeDefined();
    expect(next!.tier).toBe(2);

    const max = ActiveSkillRegistry.getNextTier('thunder_shuriken', 4);
    expect(max).toBeUndefined();
  });

  it('ilban_attack has ATTACK + TRIGGER_SKILL effects', () => {
    const ilban = ActiveSkillRegistry.getById('ilban_attack', 1)!;
    expect(ilban.effects.length).toBe(2);
    expect(ilban.effects[0].type).toBe(SkillEffectType.ATTACK);
    expect(ilban.effects[1].type).toBe(SkillEffectType.TRIGGER_SKILL);
    if (ilban.effects[0].type === SkillEffectType.ATTACK) {
      expect(ilban.effects[0].attackType).toBe(AttackType.PHYSICAL);
      expect(ilban.effects[0].coefficient).toBe(1.0);
    }
  });

  it('bunno_attack has CONSUME_RAGE + ATTACK', () => {
    const bunno = ActiveSkillRegistry.getById('bunno_attack', 1)!;
    expect(bunno.effects[0].type).toBe(SkillEffectType.CONSUME_RAGE);
    expect(bunno.effects[1].type).toBe(SkillEffectType.ATTACK);
  });

  it('thunder_shuriken has TRIGGER_SKILL + INJECT_EFFECT', () => {
    const ts = ActiveSkillRegistry.getById('thunder_shuriken', 1)!;
    const triggerEffect = ts.effects.find(e => e.type === SkillEffectType.TRIGGER_SKILL);
    expect(triggerEffect).toBeDefined();
    if (triggerEffect?.type === SkillEffectType.TRIGGER_SKILL) {
      expect(triggerEffect.targetSkillId).toBe('shuriken_summon');
    }

    const injectEffect = ts.effects.find(e => e.type === SkillEffectType.INJECT_EFFECT);
    expect(injectEffect).toBeDefined();
    if (injectEffect?.type === SkillEffectType.INJECT_EFFECT) {
      expect(injectEffect.targetSkillId).toBe('shuriken_summon');
      expect(injectEffect.injectedEffects.length).toBeGreaterThan(0);
    }
  });

  it('demon_power is special and only has tier 4', () => {
    expect(ActiveSkillRegistry.isSpecialSkill('demon_power')).toBe(true);
    const dp1 = ActiveSkillRegistry.getById('demon_power', 1);
    expect(dp1).toBeUndefined();
    const dp4 = ActiveSkillRegistry.getById('demon_power', 4);
    expect(dp4).toBeDefined();
  });
});

describe('PassiveSkillRegistry', () => {
  it('generates skills for all families with tiers', () => {
    const all = PassiveSkillRegistry.getAll();
    expect(all.length).toBeGreaterThan(0);

    const lifesteal1 = PassiveSkillRegistry.getById('lifesteal', 1);
    expect(lifesteal1).toBeDefined();
    expect(lifesteal1!.effect.type).toBe(PassiveType.LIFESTEAL);

    const lifesteal4 = PassiveSkillRegistry.getById('lifesteal', 4);
    expect(lifesteal4).toBeDefined();
    if (lifesteal4!.effect.type === PassiveType.LIFESTEAL) {
      expect(lifesteal4!.effect.rate).toBe(0.48);
    }
  });

  it('returns tier 1 skills excluding specials', () => {
    const tier1 = PassiveSkillRegistry.getTier1Skills();
    expect(tier1.length).toBeGreaterThan(0);
    for (const s of tier1) {
      expect(s.tier).toBe(1);
      expect(PassiveSkillRegistry.isSpecialSkill(s.id)).toBe(false);
    }
  });

  it('angel_power is special and only has tier 4', () => {
    expect(PassiveSkillRegistry.isSpecialSkill('angel_power')).toBe(true);
    const ap1 = PassiveSkillRegistry.getById('angel_power', 1);
    expect(ap1).toBeUndefined();
    const ap4 = PassiveSkillRegistry.getById('angel_power', 4);
    expect(ap4).toBeDefined();
  });

  it('revive has correct passive effect', () => {
    const revive = PassiveSkillRegistry.getById('revive', 1)!;
    expect(revive.effect.type).toBe(PassiveType.REVIVE);
    if (revive.effect.type === PassiveType.REVIVE) {
      expect(revive.effect.hpPercent).toBe(0.17);
      expect(revive.effect.maxUses).toBe(1);
    }
  });

  it('counter has correct passive effect', () => {
    const counter = PassiveSkillRegistry.getById('counter', 1)!;
    expect(counter.effect.type).toBe(PassiveType.COUNTER);
    if (counter.effect.type === PassiveType.COUNTER) {
      expect(counter.effect.triggerChance).toBe(0.1);
    }
  });

  it('getNextTier works for passives', () => {
    const next = PassiveSkillRegistry.getNextTier('lifesteal', 1);
    expect(next).toBeDefined();
    expect(next!.tier).toBe(2);
  });

  it('all stat modifier passives have correct types', () => {
    const critMastery = PassiveSkillRegistry.getById('crit_mastery', 1);
    expect(critMastery).toBeDefined();
    expect(critMastery!.effect.type).toBe(PassiveType.STAT_MODIFIER);
  });

  it('rage_mastery uses SKILL_MODIFIER for RAGE tag', () => {
    const rageMastery = PassiveSkillRegistry.getById('rage_mastery', 1);
    expect(rageMastery).toBeDefined();
    expect(rageMastery!.effect.type).toBe(PassiveType.SKILL_MODIFIER);
  });
});

describe('Tier Scaling', () => {
  it('higher tiers have better values for active skills', () => {
    for (let tier = 1; tier < 4; tier++) {
      const ls1 = ActiveSkillRegistry.getById('lightning_summon', tier);
      const ls2 = ActiveSkillRegistry.getById('lightning_summon', tier + 1);
      if (ls1 && ls2) {
        const coeff1 = ls1.effects.find(e => e.type === SkillEffectType.ATTACK);
        const coeff2 = ls2.effects.find(e => e.type === SkillEffectType.ATTACK);
        if (coeff1?.type === SkillEffectType.ATTACK && coeff2?.type === SkillEffectType.ATTACK) {
          expect(coeff2.coefficient).toBeGreaterThan(coeff1.coefficient);
        }
      }
    }
  });

  it('higher tiers have better values for passive skills', () => {
    const ls1 = PassiveSkillRegistry.getById('lifesteal', 1)!;
    const ls4 = PassiveSkillRegistry.getById('lifesteal', 4)!;
    if (ls1.effect.type === PassiveType.LIFESTEAL && ls4.effect.type === PassiveType.LIFESTEAL) {
      expect(ls4.effect.rate).toBeGreaterThan(ls1.effect.rate);
    }
  });
});
