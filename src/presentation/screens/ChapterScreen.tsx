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
    setLog(prev => [...prev, `${game.currentChapter!.currentDay}일차: ${enc?.type ?? '보스'}`]);
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
        setLog(prev => [...prev, `  획득: ${result.skillsGained.map(s => s.name).join(', ')}`]);
      }
      if (result.hpChange !== 0) {
        setLog(prev => [...prev, `  체력 변화: ${result.hpChange > 0 ? '+' : ''}${result.hpChange}`]);
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

    setLog(prev => [...prev, `  전투: ${battle.state} (${battle.turnCount}턴)`]);
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
      setLog(prev => [...prev, `보스 클리어! 챕터 ${game.currentChapter!.id} 완료!`]);
      game.player.resources.add('GOLD' as any, 500);
    } else {
      game.currentChapter.onBattleEnd(battle.state);
      setLog(prev => [...prev, `보스에게 패배했습니다...`]);
    }

    setBattleResult(battle.state);
    game.currentChapter = null;
    refresh();
  }

  return (
    <div className="screen">
      <h2>모험</h2>

      {!chapter && (
        <div>
          <div className="card">
            <div className="stat-row">
              <span>다음 챕터</span>
              <span>{game.player.clearedChapterMax + 1}</span>
            </div>
            <div className="stat-row">
              <span>스태미나 소모</span>
              <span>5</span>
            </div>
          </div>
          <button
            className="btn btn-primary"
            disabled={game.player.resources.stamina < 5}
            onClick={startChapter}
          >
            챕터 {game.player.clearedChapterMax + 1} 시작
          </button>
          {battleResult && (
            <div className="card" style={{ marginTop: 8 }}>
              <strong>{battleResult === BattleState.VICTORY ? '챕터 클리어!' : '챕터 실패'}</strong>
            </div>
          )}
        </div>
      )}

      {chapter && encounter && (
        <div>
          <div className="card">
            <div className="stat-row">
              <span>챕터 {chapter.id}</span>
              <span>{chapter.currentDay}일 / {chapter.totalDays}일</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${chapter.getProgress() * 100}%` }} />
            </div>
            <div className="stat-row">
              <span>스킬</span>
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
