import { describe, it, expect } from 'vitest';
import { Battle } from '../../domain/battle/Battle';
import { BattleUnit } from '../../domain/battle/BattleUnit';
import { Stats } from '../../domain/value-objects/Stats';
import { BattleState, EffectType, TriggerCondition, SkillGrade, SkillCategory } from '../../domain/enums';
import { Skill } from '../../domain/entities/Skill';

function makeSkill(id: string, effectType: EffectType, value: number, trigger: TriggerCondition): Skill {
  return new Skill(id, id, '⚔️', SkillGrade.NORMAL, SkillCategory.ATTACK, [], {
    type: effectType, value, duration: 0, scalingStat: null, statusEffectType: null,
  }, trigger);
}

describe('BattleUnit', () => {
  it('tracks HP correctly', () => {
    const unit = new BattleUnit('Test', Stats.create({ hp: 100, maxHp: 100, atk: 10, def: 5 }));
    expect(unit.isAlive()).toBe(true);

    unit.takeDamage(60);
    expect(unit.currentHp).toBe(40);
    expect(unit.isAlive()).toBe(true);

    unit.takeDamage(50);
    expect(unit.currentHp).toBe(0);
    expect(unit.isAlive()).toBe(false);
  });

  it('heals up to max HP', () => {
    const unit = new BattleUnit('Test', Stats.create({ hp: 50, maxHp: 100, atk: 10, def: 5 }));
    unit.currentHp = 50;
    const healed = unit.heal(80);
    expect(healed).toBe(50);
    expect(unit.currentHp).toBe(100);
  });

  it('reports HP percent', () => {
    const unit = new BattleUnit('Test', Stats.create({ hp: 100, maxHp: 200, atk: 10, def: 5 }));
    unit.currentHp = 100;
    expect(unit.getHpPercent()).toBeCloseTo(0.5);
  });

  it('applies multi-hit chance from passive skill', () => {
    const multiHit = makeSkill('mh', EffectType.MULTI_HIT, 0.5, TriggerCondition.PASSIVE);
    const unit = new BattleUnit('Test', Stats.create({ hp: 100, maxHp: 100, atk: 10, def: 5 }), [multiHit]);
    expect(unit.multiHitChance).toBeCloseTo(0.5);
  });

  it('applies lifesteal from passive skill', () => {
    const lifesteal = new Skill('ls', 'Lifesteal', '🩸', SkillGrade.NORMAL, SkillCategory.SURVIVAL, [], {
      type: EffectType.LIFESTEAL, value: 0.15, duration: 0, scalingStat: null, statusEffectType: null,
    }, TriggerCondition.PASSIVE);

    const unit = new BattleUnit('Test', Stats.create({ hp: 100, maxHp: 100, atk: 10, def: 5 }), [lifesteal]);
    expect(unit.lifestealRate).toBeCloseTo(0.15);
  });
});

describe('Battle', () => {
  it('player wins against weaker enemy', () => {
    const player = new BattleUnit('Player', Stats.create({ hp: 200, maxHp: 200, atk: 30, def: 10, crit: 0.1 }), [], true);
    const enemy = new BattleUnit('Slime', Stats.create({ hp: 50, maxHp: 50, atk: 5, def: 2 }), [], false);

    const battle = new Battle(player, enemy, 42);
    battle.runToCompletion();

    expect(battle.state).toBe(BattleState.VICTORY);
    expect(battle.player.isAlive()).toBe(true);
    expect(battle.enemy.isAlive()).toBe(false);
  });

  it('player loses against much stronger enemy', () => {
    const player = new BattleUnit('Player', Stats.create({ hp: 50, maxHp: 50, atk: 5, def: 2 }), [], true);
    const enemy = new BattleUnit('Dragon', Stats.create({ hp: 500, maxHp: 500, atk: 50, def: 20 }), [], false);

    const battle = new Battle(player, enemy, 42);
    battle.runToCompletion();

    expect(battle.state).toBe(BattleState.DEFEAT);
  });

  it('tracks turn count', () => {
    const player = new BattleUnit('Player', Stats.create({ hp: 100, maxHp: 100, atk: 20, def: 5 }), [], true);
    const enemy = new BattleUnit('Slime', Stats.create({ hp: 30, maxHp: 30, atk: 5, def: 2 }), [], false);

    const battle = new Battle(player, enemy, 42);
    battle.runToCompletion();

    expect(battle.turnCount).toBeGreaterThan(0);
    expect(battle.turnCount).toBeLessThan(20);
  });

  it('revive allows player to survive once', () => {
    const revive = new Skill('revive', 'Revive', '✨', SkillGrade.MYTHIC, SkillCategory.SURVIVAL, [], {
      type: EffectType.REVIVE, value: 0.3, duration: 0, scalingStat: null, statusEffectType: null,
    }, TriggerCondition.ON_DEATH);

    const player = new BattleUnit('Player', Stats.create({ hp: 30, maxHp: 100, atk: 20, def: 5 }), [revive], true);
    player.currentHp = 30;
    const enemy = new BattleUnit('Orc', Stats.create({ hp: 80, maxHp: 80, atk: 25, def: 5 }), [], false);

    const battle = new Battle(player, enemy, 42);
    battle.runToCompletion();

    const reviveLog = battle.log.entries.find(e => e.type === 'REVIVE');
    if (battle.state === BattleState.DEFEAT) {
      expect(player.reviveUsed).toBe(true);
    } else {
      expect(reviveLog).toBeDefined();
    }
  });

  it('generates battle log entries', () => {
    const player = new BattleUnit('Player', Stats.create({ hp: 100, maxHp: 100, atk: 20, def: 5 }), [], true);
    const enemy = new BattleUnit('Slime', Stats.create({ hp: 40, maxHp: 40, atk: 8, def: 2 }), [], false);

    const battle = new Battle(player, enemy, 42);
    battle.runToCompletion();

    expect(battle.log.entries.length).toBeGreaterThan(0);
    expect(battle.log.entries.some(e => e.type === 'ATTACK')).toBe(true);
  });

  it('lifesteal heals player during combat', () => {
    const lifesteal = new Skill('ls', 'Lifesteal', '🩸', SkillGrade.NORMAL, SkillCategory.SURVIVAL, [], {
      type: EffectType.LIFESTEAL, value: 0.5, duration: 0, scalingStat: null, statusEffectType: null,
    }, TriggerCondition.PASSIVE);

    const player = new BattleUnit('Player', Stats.create({ hp: 100, maxHp: 200, atk: 30, def: 5 }), [lifesteal], true);
    player.currentHp = 100;
    const enemy = new BattleUnit('Orc', Stats.create({ hp: 200, maxHp: 200, atk: 10, def: 3 }), [], false);

    const battle = new Battle(player, enemy, 42);
    battle.runToCompletion();

    const lsEntries = battle.log.entries.filter(e => e.type === 'LIFESTEAL');
    expect(lsEntries.length).toBeGreaterThan(0);
  });

  it('turn-start skills fire each turn', () => {
    const lance = new Skill('lance', 'Lance', '🔱', SkillGrade.NORMAL, SkillCategory.ATTACK, [], {
      type: EffectType.DAMAGE, value: 20, duration: 0, scalingStat: null, statusEffectType: null,
    }, TriggerCondition.TURN_START);

    const player = new BattleUnit('Player', Stats.create({ hp: 200, maxHp: 200, atk: 10, def: 5 }), [lance], true);
    const enemy = new BattleUnit('Orc', Stats.create({ hp: 100, maxHp: 100, atk: 10, def: 3 }), [], false);

    const battle = new Battle(player, enemy, 42);
    battle.runToCompletion();

    const skillEntries = battle.log.entries.filter(e => e.type === 'SKILL_DAMAGE' && e.skillName === 'Lance');
    expect(skillEntries.length).toBeGreaterThan(0);
  });
});
