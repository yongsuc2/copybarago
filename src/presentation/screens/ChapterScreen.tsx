import { useState } from 'react';
import { useGame } from '../GameContext';
import { ChapterType, EncounterType, BattleState } from '../../domain/enums';
import type { Encounter } from '../../domain/chapter/Encounter';
import { BattleUnit } from '../../domain/battle/BattleUnit';

export function ChapterScreen() {
  const { game, refresh } = useGame();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [battleResult, setBattleResult] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const chapter = game.currentChapter;

  function startChapter() {
    const nextId = game.player.clearedChapterMax + 1;
    const type = nextId <= 3 ? ChapterType.FIVE_DAY
      : nextId % 2 === 0 ? ChapterType.THIRTY_DAY
      : ChapterType.SIXTY_DAY;

    game.startChapter(nextId, type);
    setBattleResult(null);
    setLog([]);
    advanceDay();
  }

  function advanceDay() {
    if (!game.currentChapter) return;

    if (game.currentChapter.isBossDay()) {
      runBossBattle();
      return;
    }

    const enc = game.currentChapter.advanceDay();
    setEncounter(enc);
    setLog(prev => [...prev, `Day ${game.currentChapter!.currentDay}: ${enc?.type ?? 'BOSS'}`]);
    refresh();
  }

  function selectOption(index: number) {
    if (!game.currentChapter || !encounter) return;

    if (encounter.type === EncounterType.COMBAT && index === 0) {
      runCombatBattle();
      return;
    }

    const stats = game.player.computeStats();
    const result = game.currentChapter.resolveEncounter(index, stats.hp, stats.maxHp);
    if (result) {
      if (result.skillsGained.length > 0) {
        setLog(prev => [...prev, `  Gained: ${result.skillsGained.map(s => s.name).join(', ')}`]);
      }
      if (result.hpChange !== 0) {
        setLog(prev => [...prev, `  HP change: ${result.hpChange > 0 ? '+' : ''}${result.hpChange}`]);
      }
    }

    setEncounter(null);
    refresh();
    setTimeout(() => advanceDay(), 300);
  }

  function runCombatBattle() {
    if (!game.currentChapter) return;

    const stats = game.player.computeStats();
    const playerUnit = new BattleUnit('Capybara', stats, [...game.currentChapter.sessionSkills], true);
    const battle = game.currentChapter.createCombatBattle(playerUnit);
    if (!battle) return;

    battle.runToCompletion();
    game.currentChapter.onBattleEnd(battle.state);

    setLog(prev => [...prev, `  Battle: ${battle.state} in ${battle.turnCount} turns`]);
    setBattleResult(battle.state);

    if (battle.state === BattleState.DEFEAT) {
      game.currentChapter = null;
    } else {
      setEncounter(null);
      setTimeout(() => advanceDay(), 300);
    }
    refresh();
  }

  function runBossBattle() {
    if (!game.currentChapter) return;

    const stats = game.player.computeStats();
    const playerUnit = new BattleUnit('Capybara', stats, [...game.currentChapter.sessionSkills], true);
    const battle = game.currentChapter.createBossBattle(playerUnit);
    if (!battle) return;

    battle.runToCompletion();

    if (battle.state === BattleState.VICTORY) {
      game.currentChapter.onBossDefeated();
      game.player.clearedChapterMax = Math.max(game.player.clearedChapterMax, game.currentChapter.id);
      game.travel.maxClearedChapter = game.player.clearedChapterMax;
      setLog(prev => [...prev, `BOSS CLEAR! Chapter ${game.currentChapter!.id} completed!`]);
      game.player.resources.add('GOLD' as any, 500);
    } else {
      game.currentChapter.onBattleEnd(battle.state);
      setLog(prev => [...prev, `Boss defeated you...`]);
    }

    setBattleResult(battle.state);
    game.currentChapter = null;
    refresh();
  }

  return (
    <div className="screen">
      <h2>Adventure</h2>

      {!chapter && (
        <div>
          <div className="card">
            <div className="stat-row">
              <span>Next Chapter</span>
              <span>{game.player.clearedChapterMax + 1}</span>
            </div>
            <div className="stat-row">
              <span>Stamina Cost</span>
              <span>5</span>
            </div>
          </div>
          <button
            className="btn btn-primary"
            disabled={game.player.resources.stamina < 5}
            onClick={startChapter}
          >
            Start Chapter {game.player.clearedChapterMax + 1}
          </button>
          {battleResult && (
            <div className="card" style={{ marginTop: 8 }}>
              <strong>{battleResult === BattleState.VICTORY ? 'Chapter Cleared!' : 'Chapter Failed'}</strong>
            </div>
          )}
        </div>
      )}

      {chapter && encounter && (
        <div>
          <div className="card">
            <div className="stat-row">
              <span>Chapter {chapter.id}</span>
              <span>Day {chapter.currentDay}/{chapter.totalDays}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${chapter.getProgress() * 100}%` }} />
            </div>
            <div className="stat-row">
              <span>Skills</span>
              <span>{chapter.sessionSkills.length}</span>
            </div>
          </div>

          <h3>{encounter.type}</h3>
          <div className="encounter-options">
            {encounter.options.map((opt, i) => (
              <div key={i} className="encounter-option" onClick={() => selectOption(i)}>
                <div style={{ fontWeight: 'bold' }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: '#999' }}>{opt.description}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {log.length > 0 && (
        <div className="battle-log" style={{ marginTop: 12 }}>
          {log.map((entry, i) => (
            <div key={i} className="log-entry">{entry}</div>
          ))}
        </div>
      )}
    </div>
  );
}
