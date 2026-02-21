import { describe, it, expect } from 'vitest';
import { Chapter, ChapterState } from '../../domain/chapter/Chapter';
import { ChapterType, EncounterType, BattleState, PassiveType, StatType } from '../../domain/enums';
import { BattleUnit } from '../../domain/battle/BattleUnit';
import { Stats } from '../../domain/value-objects/Stats';
import { PassiveSkill } from '../../domain/entities/PassiveSkill';

describe('Chapter', () => {
  it('creates with correct total days', () => {
    const ch60 = new Chapter(1, ChapterType.SIXTY_DAY, 42);
    expect(ch60.totalDays).toBe(60);

    const ch30 = new Chapter(2, ChapterType.THIRTY_DAY, 42);
    expect(ch30.totalDays).toBe(30);

    const ch5 = new Chapter(3, ChapterType.FIVE_DAY, 42);
    expect(ch5.totalDays).toBe(5);
  });

  it('advances day and generates encounter', () => {
    const chapter = new Chapter(1, ChapterType.SIXTY_DAY, 42);
    const encounter = chapter.advanceDay();

    expect(encounter).not.toBeNull();
    expect(chapter.currentDay).toBe(1);
    expect(chapter.state).toBe(ChapterState.IN_PROGRESS);
  });

  it('reaches boss day after all days', () => {
    const chapter = new Chapter(1, ChapterType.FIVE_DAY, 42);

    for (let i = 0; i < 5; i++) {
      chapter.advanceDay();
      if (chapter.currentEncounter) {
        if (chapter.currentEncounter.type === EncounterType.COMBAT) {
          chapter.resolveEncounter(1, 100, 100);
        } else {
          chapter.resolveEncounter(0, 100, 100);
        }
      }
    }

    expect(chapter.isBossDay()).toBe(true);
  });

  it('resolves non-combat encounter and gains skills', () => {
    let angelFound = false;

    for (let attempt = 0; attempt < 50; attempt++) {
      const testChapter = new Chapter(1, ChapterType.SIXTY_DAY, attempt);
      const encounter = testChapter.advanceDay();
      if (encounter && encounter.type === EncounterType.ANGEL) {
        const result = testChapter.resolveEncounter(0, 100, 100);
        if (result && result.skillsGained.length > 0) {
          expect(testChapter.sessionSkills.length).toBeGreaterThan(0);
          angelFound = true;
          break;
        }
      }
    }

    expect(angelFound).toBe(true);
  });

  it('tracks progress correctly', () => {
    const chapter = new Chapter(1, ChapterType.FIVE_DAY, 42);
    expect(chapter.getProgress()).toBe(0);

    chapter.advanceDay();
    expect(chapter.getProgress()).toBeCloseTo(0.2);
  });

  it('sets failed state on battle defeat', () => {
    const chapter = new Chapter(1, ChapterType.FIVE_DAY, 42);
    chapter.advanceDay();
    chapter.onBattleEnd(BattleState.DEFEAT);
    expect(chapter.state).toBe(ChapterState.FAILED);
  });

  it('sets cleared state on boss defeated', () => {
    const chapter = new Chapter(1, ChapterType.FIVE_DAY, 42);
    chapter.onBossDefeated();
    expect(chapter.state).toBe(ChapterState.CLEARED);
  });

  it('creates combat battle when encounter is COMBAT', () => {
    let battleCreated = false;

    for (let seed = 0; seed < 100; seed++) {
      const chapter = new Chapter(1, ChapterType.FIVE_DAY, seed);
      const encounter = chapter.advanceDay();

      if (encounter && encounter.type === EncounterType.COMBAT) {
        const player = new BattleUnit(
          'Player',
          Stats.create({ hp: 200, maxHp: 200, atk: 30, def: 10 }),
          [], [], true,
        );
        const battle = chapter.createCombatBattle(player);
        if (battle) {
          expect(battle.player).toBe(player);
          expect(battle.enemy).toBeDefined();
          battleCreated = true;
          break;
        }
      }
    }

    expect(battleCreated).toBe(true);
  });

  describe('session HP with hp_fortify', () => {
    function makeHpPassive(value: number): PassiveSkill {
      return new PassiveSkill('hp_fortify', '체력 강화', '❤️', 1, [], [], {
        type: PassiveType.STAT_MODIFIER, stat: StatType.HP, value, isPercentage: true,
      });
    }

    it('recalcSessionMaxHp applies HP passives from base', () => {
      const chapter = new Chapter(1, ChapterType.FIVE_DAY, 42);
      chapter.initSessionHp(100);
      chapter.sessionSkills.push(makeHpPassive(0.1));
      chapter.recalcSessionMaxHp();

      expect(chapter.sessionMaxHp).toBe(110);
    });

    it('recalcSessionMaxHp preserves HP ratio (50/100 → 55/110)', () => {
      const chapter = new Chapter(1, ChapterType.FIVE_DAY, 42);
      chapter.initSessionHp(100);
      chapter.sessionCurrentHp = 50;
      chapter.sessionSkills.push(makeHpPassive(0.1));
      chapter.recalcSessionMaxHp();

      expect(chapter.sessionMaxHp).toBe(110);
      expect(chapter.sessionCurrentHp).toBe(55);
    });

    it('recalcSessionMaxHp recalculates from baseSessionMaxHp on tier upgrade', () => {
      const chapter = new Chapter(1, ChapterType.FIVE_DAY, 42);
      chapter.initSessionHp(100);

      chapter.sessionSkills.push(makeHpPassive(0.05));
      chapter.recalcSessionMaxHp();
      expect(chapter.sessionMaxHp).toBe(105);

      chapter.sessionSkills[0] = makeHpPassive(0.1);
      chapter.recalcSessionMaxHp();
      expect(chapter.sessionMaxHp).toBe(110);
    });

    it('getBattlePassiveSkills excludes HP STAT_MODIFIERs', () => {
      const chapter = new Chapter(1, ChapterType.FIVE_DAY, 42);
      const hpPassive = makeHpPassive(0.1);
      const otherPassive = new PassiveSkill('lifesteal', '흡혈', '🩸', 1, [], [], {
        type: PassiveType.LIFESTEAL, rate: 0.1,
      });
      chapter.sessionSkills.push(hpPassive, otherPassive);

      const battlePassives = chapter.getBattlePassiveSkills();
      expect(battlePassives).toHaveLength(1);
      expect(battlePassives[0].id).toBe('lifesteal');
    });
  });
});
