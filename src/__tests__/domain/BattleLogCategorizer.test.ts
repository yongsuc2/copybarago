import { describe, it, expect } from 'vitest';
import { categorizeBattleEntries } from '../../domain/battle/BattleLogCategorizer';
import { BattleLogType, type BattleLogEntry } from '../../domain/battle/BattleLog';
import { Battle } from '../../domain/battle/Battle';
import { BattleUnit } from '../../domain/battle/BattleUnit';
import { Stats } from '../../domain/value-objects/Stats';
import { SkillHierarchy, SkillEffectType, AttackType } from '../../domain/enums';
import { ActiveSkill, trigger, everyNTurns, prob, noCondition } from '../../domain/entities/ActiveSkill';
import { ActiveSkillRegistry } from '../../domain/data/ActiveSkillRegistry';

const PLAYER = 'Player';
const ENEMY = 'Orc';

function makeEntry(type: BattleLogType, source: string, target: string, value: number, skillName?: string): BattleLogEntry {
  return { turn: 1, type, source, target, value, skillName, message: '' };
}

describe('BattleLogCategorizer', () => {
  it('basic attack categorizes as normal attack', () => {
    const entries = [makeEntry(BattleLogType.ATTACK, PLAYER, ENEMY, 100)];
    const result = categorizeBattleEntries(entries, PLAYER);
    expect(result.damageMap.get('일반 공격')).toBe(100);
    expect(result.damageMap.size).toBe(1);
  });

  it('basic crit categorizes as normal attack', () => {
    const entries = [makeEntry(BattleLogType.CRIT, PLAYER, ENEMY, 200)];
    const result = categorizeBattleEntries(entries, PLAYER);
    expect(result.damageMap.get('일반 공격')).toBe(200);
  });

  it('skill damage categorizes by skill name', () => {
    const entries = [makeEntry(BattleLogType.SKILL_DAMAGE, PLAYER, ENEMY, 150, '광창 소환')];
    const result = categorizeBattleEntries(entries, PLAYER);
    expect(result.damageMap.get('광창 소환')).toBe(150);
    expect(result.damageMap.size).toBe(1);
  });

  it('skill crit categorizes by skill name', () => {
    const entries = [makeEntry(BattleLogType.CRIT, PLAYER, ENEMY, 300, '광창 소환')];
    const result = categorizeBattleEntries(entries, PLAYER);
    expect(result.damageMap.get('광창 소환')).toBe(300);
    expect(result.damageMap.has('일반 공격')).toBe(false);
  });

  it('mixed entries categorize correctly', () => {
    const entries = [
      makeEntry(BattleLogType.ATTACK, PLAYER, ENEMY, 100),
      makeEntry(BattleLogType.CRIT, PLAYER, ENEMY, 200),
      makeEntry(BattleLogType.SKILL_DAMAGE, PLAYER, ENEMY, 150, '광창 소환'),
      makeEntry(BattleLogType.CRIT, PLAYER, ENEMY, 300, '광창 소환'),
      makeEntry(BattleLogType.COUNTER, PLAYER, ENEMY, 80),
      makeEntry(BattleLogType.RAGE_ATTACK, PLAYER, ENEMY, 250),
    ];

    const result = categorizeBattleEntries(entries, PLAYER);

    expect(result.damageMap.size).toBe(4);
    expect(result.damageMap.get('일반 공격')).toBe(300);
    expect(result.damageMap.get('광창 소환')).toBe(450);
    expect(result.damageMap.get('반격')).toBe(80);
    expect(result.damageMap.get('분노 공격')).toBe(250);
  });

  it('enemy damage excluded from player map', () => {
    const entries = [
      makeEntry(BattleLogType.ATTACK, ENEMY, PLAYER, 100),
      makeEntry(BattleLogType.ATTACK, PLAYER, ENEMY, 50),
    ];
    const result = categorizeBattleEntries(entries, PLAYER);
    expect(result.damageMap.size).toBe(1);
    expect(result.damageMap.get('일반 공격')).toBe(50);
  });

  it('dot damage categorizes as poison', () => {
    const entries = [makeEntry(BattleLogType.DOT_DAMAGE, PLAYER, ENEMY, 30)];
    const result = categorizeBattleEntries(entries, PLAYER);
    expect(result.damageMap.get('독 피해')).toBe(30);
  });

  it('lifesteal categorizes in heal map', () => {
    const entries = [makeEntry(BattleLogType.LIFESTEAL, PLAYER, PLAYER, 40)];
    const result = categorizeBattleEntries(entries, PLAYER);
    expect(result.healMap.get('흡혈')).toBe(40);
  });

  it('hot heal categorizes as regeneration', () => {
    const entries = [makeEntry(BattleLogType.HOT_HEAL, PLAYER, PLAYER, 25)];
    const result = categorizeBattleEntries(entries, PLAYER);
    expect(result.healMap.get('재생')).toBe(25);
  });

  it('revive categorizes in heal map', () => {
    const entries = [makeEntry(BattleLogType.REVIVE, PLAYER, PLAYER, 30)];
    const result = categorizeBattleEntries(entries, PLAYER);
    expect(result.healMap.get('부활')).toBe(30);
  });

  it('skill heal categorizes by skill name', () => {
    const entries = [makeEntry(BattleLogType.HEAL, PLAYER, PLAYER, 50, '치유의 빛')];
    const result = categorizeBattleEntries(entries, PLAYER);
    expect(result.healMap.get('치유의 빛')).toBe(50);
  });

  it('skill heal without name categorizes as generic heal', () => {
    const entries = [makeEntry(BattleLogType.HEAL, PLAYER, PLAYER, 50)];
    const result = categorizeBattleEntries(entries, PLAYER);
    expect(result.healMap.get('회복')).toBe(50);
  });

  it('integration: skill crits use skill name in real battle', () => {
    const lance = new ActiveSkill(
      'lance_summon', '광창 소환', '🔱', SkillHierarchy.LOWEST, 1, [], [],
      trigger(everyNTurns(1), prob(1.0), noCondition()),
      [{ type: SkillEffectType.ATTACK, attackType: AttackType.PHYSICAL, coefficient: 0.5 }],
    );

    const builtinSkills = ActiveSkillRegistry.getBuiltinSkills();
    const allSkills = [...builtinSkills, lance];

    const player = new BattleUnit(
      'Player',
      Stats.create({ hp: 500, maxHp: 500, atk: 50, def: 10, crit: 1.0 }),
      allSkills,
      undefined,
      true,
    );
    const enemy = new BattleUnit('Orc', Stats.create({ hp: 300, maxHp: 300, atk: 10, def: 3 }), undefined, undefined, false);

    const battle = new Battle(player, enemy, 42);
    battle.runToCompletion();

    const critWithSkill = battle.log.entries
      .filter(e => e.type === BattleLogType.CRIT && e.skillName && e.skillName !== '일반 공격');

    if (critWithSkill.length > 0) {
      const result = categorizeBattleEntries(battle.log.entries, 'Player');
      for (const entry of critWithSkill) {
        expect(result.damageMap.has(entry.skillName!)).toBe(true);
      }
    }
  });

  it('integration: all player damage accounted for', () => {
    const player = new BattleUnit('Player', Stats.create({ hp: 200, maxHp: 200, atk: 30, def: 10 }), undefined, undefined, true);
    const enemy = new BattleUnit('Slime', Stats.create({ hp: 100, maxHp: 100, atk: 5, def: 2 }), undefined, undefined, false);

    const battle = new Battle(player, enemy, 42);
    battle.runToCompletion();

    const result = categorizeBattleEntries(battle.log.entries, 'Player');

    let categorizedTotal = 0;
    for (const v of result.damageMap.values()) categorizedTotal += v;

    const expectedTotal = battle.log.entries
      .filter(e =>
        e.source === 'Player' && e.target !== 'Player' &&
        (e.type === BattleLogType.ATTACK || e.type === BattleLogType.CRIT ||
         e.type === BattleLogType.SKILL_DAMAGE || e.type === BattleLogType.COUNTER ||
         e.type === BattleLogType.RAGE_ATTACK || e.type === BattleLogType.DOT_DAMAGE))
      .reduce((sum, e) => sum + e.value, 0);

    expect(categorizedTotal).toBe(expectedTotal);
  });
});
