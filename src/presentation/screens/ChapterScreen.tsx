import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../GameContext';
import { ChapterType, EncounterType, BattleState } from '../../domain/enums';
import type { Encounter } from '../../domain/chapter/Encounter';
import { BattleUnit } from '../../domain/battle/BattleUnit';
import { Battle } from '../../domain/battle/Battle';
import type { BattleLogEntry } from '../../domain/battle/BattleLog';
import { BattleLogType } from '../../domain/battle/BattleLog';
import type { AttackPhase } from '../components/BattleArena';
import { AdventureStage } from '../components/AdventureStage';
import { PlayerStatsBar } from '../components/PlayerStatsBar';
import { DamageGraph, type DamageSource } from '../components/DamageGraph';
import { EncounterDataTable } from '../../domain/data/EncounterDataTable';
import { Package, Home, Swords, Zap, Star, BarChart3 } from 'lucide-react';

const MAX_BATTLE_TURNS = 15;

const PHASE_DURATION = {
  approach: 350,
  hit: 300,
  retreat: 350,
  pause: 200,
};

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cloneUnit(unit: BattleUnit): BattleUnit {
  return Object.assign(Object.create(Object.getPrototypeOf(unit)), unit);
}

function isDamageOrHeal(type: BattleLogType): boolean {
  return type === BattleLogType.ATTACK
    || type === BattleLogType.SKILL_DAMAGE
    || type === BattleLogType.COUNTER
    || type === BattleLogType.CRIT
    || type === BattleLogType.DOT_DAMAGE
    || type === BattleLogType.LIFESTEAL
    || type === BattleLogType.HOT_HEAL
    || type === BattleLogType.REVIVE;
}

function splitToAnimationGroups(entries: BattleLogEntry[]): BattleLogEntry[][] {
  const groups: BattleLogEntry[][] = [];

  for (const entry of entries) {
    if (entry.type === BattleLogType.LIFESTEAL) {
      if (groups.length > 0) {
        groups[groups.length - 1].push(entry);
      } else {
        groups.push([entry]);
      }
    } else {
      groups.push([entry]);
    }
  }
  return groups;
}

export function ChapterScreen() {
  const { game, refresh, setScreen } = useGame();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [, setBattleResult] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const [, setBattle] = useState<Battle | null>(null);
  const [playerUnit, setPlayerUnit] = useState<BattleUnit | null>(null);
  const [enemyUnit, setEnemyUnit] = useState<BattleUnit | null>(null);
  const [attackPhase, setAttackPhase] = useState<AttackPhase>('idle');
  const [damageEntries, setDamageEntries] = useState<BattleLogEntry[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  const [isBattling, setIsBattling] = useState(false);
  const [isBossFight, setIsBossFight] = useState(false);
  const [chapterResult, setChapterResult] = useState<{ type: 'victory' | 'defeat'; chapterId: number; gold: number } | null>(null);

  const [showDamageGraph, setShowDamageGraph] = useState(false);
  const [damageSourcesSnapshot, setDamageSourcesSnapshot] = useState<DamageSource[]>([]);
  const damageMapRef = useRef<Map<string, DamageSource>>(new Map());

  const cancelledRef = useRef(false);
  const battleRef = useRef<Battle | null>(null);

  const chapter = game.currentChapter;

  function accumulateDamage(entries: BattleLogEntry[], playerName: string) {
    const map = damageMapRef.current;
    for (const entry of entries) {
      const isDmgType = entry.type === BattleLogType.ATTACK
        || entry.type === BattleLogType.CRIT
        || entry.type === BattleLogType.SKILL_DAMAGE
        || entry.type === BattleLogType.COUNTER;
      const isDot = entry.type === BattleLogType.DOT_DAMAGE;

      if (isDmgType && entry.source === playerName && entry.target !== playerName) {
        let key: string;
        let icon: string;
        if (entry.type === BattleLogType.SKILL_DAMAGE && entry.skillName) {
          key = entry.skillName;
          icon = entry.skillIcon ?? '✨';
        } else if (entry.type === BattleLogType.COUNTER) {
          key = '반격';
          icon = '🛡️';
        } else {
          key = '일반 공격';
          icon = '⚔️';
        }
        const existing = map.get(key);
        if (existing) {
          existing.total += entry.value;
        } else {
          map.set(key, { label: key, icon, total: entry.value });
        }
      } else if (isDot && entry.target !== playerName) {
        const key = '독 피해';
        const icon = '☠️';
        const existing = map.get(key);
        if (existing) {
          existing.total += entry.value;
        } else {
          map.set(key, { label: key, icon, total: entry.value });
        }
      }
    }
    setDamageSourcesSnapshot([...map.values()]);
  }

  const clearBattleState = useCallback(() => {
    setIsBattling(false);
    setBattle(null);
    setPlayerUnit(null);
    setEnemyUnit(null);
    setAttackPhase('idle');
    setDamageEntries([]);
    setTurnCount(0);
    battleRef.current = null;
  }, []);

  const finishBattle = useCallback((b: Battle, boss: boolean) => {
    if (boss) {
      const chId = game.currentChapter?.id ?? 0;
      if (b.state === BattleState.VICTORY) {
        game.currentChapter?.onBossDefeated();
        if (game.currentChapter) {
          game.player.clearedChapterMax = Math.max(game.player.clearedChapterMax, game.currentChapter.id);
          game.travel.maxClearedChapter = game.player.clearedChapterMax;
          game.player.resources.add('GOLD' as any, 500);
        }
        game.updateQuestProgress('daily_chapter');
        game.updateQuestProgress('weekly_chapter');
      } else {
        game.currentChapter?.onBattleEnd(b.state);
      }
      if (game.currentChapter) {
        game.player.updateBestSurvivalDay(
          game.currentChapter.id,
          game.currentChapter.currentDay,
          game.currentChapter.isCompleted(),
        );
      }
      game.currentChapter = null;

      setTimeout(() => {
        clearBattleState();
        game.saveGame();
        setChapterResult({
          type: b.state === BattleState.VICTORY ? 'victory' : 'defeat',
          chapterId: chId,
          gold: b.state === BattleState.VICTORY ? 500 : 0,
        });
        refresh();
      }, 1500);
    } else {
      if (game.currentChapter && b.state === BattleState.VICTORY) {
        game.currentChapter.updateSessionHpAfterBattle(b.player.currentHp);
      }
      game.currentChapter?.onBattleEnd(b.state);
      setLog(prev => [...prev, `  전투: ${b.state} (${b.turnCount}턴)`]);
      setBattleResult(b.state);

      if (b.state === BattleState.DEFEAT) {
        const chId = game.currentChapter?.id ?? 0;
        if (game.currentChapter) {
          game.player.updateBestSurvivalDay(
            game.currentChapter.id,
            game.currentChapter.currentDay,
            false,
          );
        }
        game.currentChapter = null;

        setTimeout(() => {
          clearBattleState();
          game.saveGame();
          setChapterResult({
            type: 'defeat',
            chapterId: chId,
            gold: 0,
          });
          refresh();
        }, 1500);
      } else {
        setTimeout(() => {
          clearBattleState();
          setEncounter(null);
          setTimeout(() => advanceDay(), 400);
          refresh();
        }, 1500);
      }
    }
  }, [game, refresh, clearBattleState]);

  const advanceDay = useCallback(() => {
    if (!game.currentChapter) return;

    if (game.currentChapter.isBossDay()) {
      startBossBattle();
      return;
    }

    const enc = game.currentChapter.advanceDay();

    if (!enc && game.currentChapter.isBossDay()) {
      startBossBattle();
      return;
    }

    setLog(prev => [...prev, `${game.currentChapter!.currentDay}일차: ${enc?.type ?? '???'}`]);

    if (enc?.type === EncounterType.COMBAT) {
      const stats = game.player.computeStats();
      const battleStats = stats.withHp(game.currentChapter.sessionCurrentHp);
      const pu = new BattleUnit('Capybara', battleStats, [...game.currentChapter.sessionSkills], true);
      const b = game.currentChapter.createCombatBattle(pu);
      if (b) {
        startBattle(b, false);
      }
      refresh();
      return;
    }

    if (enc && enc.options.length === 1) {
      const ch = game.currentChapter;
      const result = ch.resolveEncounter(0, ch.sessionCurrentHp, ch.sessionMaxHp);
      if (result) {
        if (result.skillsGained.length > 0) {
          setLog(prev => [...prev, `  획득: ${result.skillsGained.map(s => `${s.icon} ${s.name}`).join(', ')}`]);
        }
        if (result.hpChange !== 0) {
          setLog(prev => [...prev, `  체력 변화: ${result.hpChange > 0 ? '+' : ''}${result.hpChange}`]);
        }
      }
      refresh();
      setTimeout(() => advanceDay(), 300);
      return;
    }

    setEncounter(enc);
    refresh();
  }, [game, refresh]);

  function computeMidTurnHp(
    playerHpBefore: number,
    enemyHpBefore: number,
    entries: BattleLogEntry[],
    playerName: string,
    playerMaxHp: number,
    enemyMaxHp: number,
  ) {
    let playerHp = playerHpBefore;
    let enemyHp = enemyHpBefore;

    for (const entry of entries) {
      const isHeal = entry.type === BattleLogType.LIFESTEAL
        || entry.type === BattleLogType.HOT_HEAL
        || entry.type === BattleLogType.REVIVE;
      if (isHeal) {
        if (entry.target === playerName) playerHp += entry.value;
        else enemyHp += entry.value;
      } else {
        if (entry.target === playerName) playerHp -= entry.value;
        else enemyHp -= entry.value;
      }
    }

    return {
      playerHp: Math.max(0, Math.min(playerHp, playerMaxHp)),
      enemyHp: Math.max(0, Math.min(enemyHp, enemyMaxHp)),
    };
  }

  async function animateHitGroup(
    hitGroup: BattleLogEntry[],
    side: 'player' | 'enemy',
    runningPlayerHp: number,
    runningEnemyHp: number,
    b: Battle,
    playerName: string,
  ): Promise<{ playerHp: number; enemyHp: number }> {
    const hp = computeMidTurnHp(
      runningPlayerHp, runningEnemyHp,
      hitGroup, playerName,
      b.player.maxHp, b.enemy.maxHp,
    );

    setAttackPhase(`${side}-approach`);
    await delay(PHASE_DURATION.approach);
    if (cancelledRef.current) return hp;

    setDamageEntries(hitGroup);
    const midPlayer = cloneUnit(b.player);
    midPlayer.currentHp = hp.playerHp;
    const midEnemy = cloneUnit(b.enemy);
    midEnemy.currentHp = hp.enemyHp;
    setPlayerUnit(midPlayer);
    setEnemyUnit(midEnemy);
    setAttackPhase(`${side}-hit`);
    await delay(PHASE_DURATION.hit);
    if (cancelledRef.current) return hp;

    setAttackPhase(`${side}-retreat`);
    await delay(PHASE_DURATION.retreat);
    if (cancelledRef.current) return hp;

    setDamageEntries([]);
    setAttackPhase('idle');
    await delay(PHASE_DURATION.pause);

    return hp;
  }

  async function animateTurn(b: Battle, playerName: string) {
    if (cancelledRef.current) return;

    const playerHpBefore = b.player.currentHp;
    const enemyHpBefore = b.enemy.currentHp;

    const result = b.executeTurn();
    setTurnCount(result.turnNumber);
    accumulateDamage(result.entries, playerName);

    const playerEntries: BattleLogEntry[] = [];
    const enemyEntries: BattleLogEntry[] = [];

    for (const entry of result.entries) {
      if (!isDamageOrHeal(entry.type)) continue;
      if (entry.source === playerName) {
        playerEntries.push(entry);
      } else {
        enemyEntries.push(entry);
      }
    }

    let runningPlayerHp = playerHpBefore;
    let runningEnemyHp = enemyHpBefore;

    if (playerEntries.length > 0 && !cancelledRef.current) {
      const groups = splitToAnimationGroups(playerEntries);
      for (const group of groups) {
        if (cancelledRef.current || runningEnemyHp <= 0) break;
        const hp = await animateHitGroup(group, 'player', runningPlayerHp, runningEnemyHp, b, playerName);
        runningPlayerHp = hp.playerHp;
        runningEnemyHp = hp.enemyHp;
      }
    }

    if (enemyEntries.length > 0 && !cancelledRef.current && runningEnemyHp > 0) {
      const groups = splitToAnimationGroups(enemyEntries);
      for (const group of groups) {
        if (cancelledRef.current || runningPlayerHp <= 0) break;
        const hp = await animateHitGroup(group, 'enemy', runningPlayerHp, runningEnemyHp, b, playerName);
        runningPlayerHp = hp.playerHp;
        runningEnemyHp = hp.enemyHp;
      }
    }

    if (playerEntries.length === 0 && enemyEntries.length === 0) {
      setPlayerUnit(cloneUnit(b.player));
      setEnemyUnit(cloneUnit(b.enemy));
      await delay(PHASE_DURATION.pause);
    }
  }

  async function runBattleLoop(b: Battle, boss: boolean) {
    const playerName = b.player.name;

    while (!cancelledRef.current && !b.isFinished() && b.turnCount < MAX_BATTLE_TURNS) {
      await animateTurn(b, playerName);
    }

    if (cancelledRef.current) return;

    if (b.state === BattleState.IN_PROGRESS) {
      (b as any).state = BattleState.DEFEAT;
    }

    finishBattle(b, boss);
  }

  function startBattle(b: Battle, boss: boolean) {
    cancelledRef.current = false;
    battleRef.current = b;
    damageMapRef.current = new Map();
    setDamageSourcesSnapshot([]);
    setBattle(b);
    setPlayerUnit(cloneUnit(b.player));
    setEnemyUnit(cloneUnit(b.enemy));
    setIsBattling(true);
    setIsBossFight(boss);
    setAttackPhase('idle');
    setDamageEntries([]);
    setTurnCount(0);

    runBattleLoop(b, boss);
  }

  function startBossBattle() {
    if (!game.currentChapter) return;

    const stats = game.player.computeStats();
    const battleStats = stats.withHp(game.currentChapter.sessionCurrentHp);
    const pu = new BattleUnit('Capybara', battleStats, [...game.currentChapter.sessionSkills], true);
    const b = game.currentChapter.createBossBattle(pu);
    if (!b) return;

    startBattle(b, true);
  }

  function startChapter() {
    const nextId = game.player.clearedChapterMax + 1;
    const type = ChapterType.SIXTY_DAY;

    game.startChapter(nextId, type);
    const stats = game.player.computeStats();
    game.currentChapter!.initSessionHp(stats.maxHp);
    setBattleResult(null);
    setChapterResult(null);
    setLog([]);
    advanceDay();
  }

  function abandonChapter() {
    const chId = game.currentChapter?.id ?? 0;
    cancelledRef.current = true;
    if (game.currentChapter) {
      game.player.updateBestSurvivalDay(
        game.currentChapter.id,
        game.currentChapter.currentDay,
        false,
      );
    }
    game.currentChapter = null;
    clearBattleState();
    setEncounter(null);
    game.saveGame();
    setChapterResult({ type: 'defeat', chapterId: chId, gold: 0 });
    refresh();
  }

  function selectOption(index: number) {
    if (!game.currentChapter || !encounter) return;

    const ch = game.currentChapter;
    const result = ch.resolveEncounter(index, ch.sessionCurrentHp, ch.sessionMaxHp);
    if (result) {
      if (result.skillsGained.length > 0) {
        setLog(prev => [...prev, `  획득: ${result.skillsGained.map(s => `${s.icon} ${s.name}`).join(', ')}`]);
      }
      if (result.hpChange !== 0) {
        setLog(prev => [...prev, `  체력 변화: ${result.hpChange > 0 ? '+' : ''}${result.hpChange}`]);
      }
    }

    setEncounter(null);
    refresh();
    setTimeout(() => advanceDay(), 300);
  }

  useEffect(() => {
    if (game.currentChapter && !encounter && !isBattling) {
      if (game.currentChapter.sessionMaxHp === 0) {
        const stats = game.player.computeStats();
        game.currentChapter.initSessionHp(stats.maxHp);
      }
      advanceDay();
    }
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const playerStats = game.player.computeStats();

  return (
    <div className="screen">
      <h2>모험</h2>

      {!chapter && !isBattling && !chapterResult && (
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
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              disabled={game.player.resources.stamina < 5}
              onClick={startChapter}
            >
              챕터 {game.player.clearedChapterMax + 1} 시작
            </button>
            <button
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => setScreen('chapter-treasure')}
            >
              <Package size={16} />
              보물상자
            </button>
          </div>
        </div>
      )}

      {(chapter || isBattling) && !chapterResult && (
        <div>
          {chapter && (
            <div className="card" style={{ marginBottom: 8 }}>
              <div className="stat-row">
                <span>챕터 {chapter.id}</span>
                <span>{chapter.currentDay}일 / {chapter.totalDays}일</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${chapter.getProgress() * 100}%` }} />
              </div>
              {!isBattling && (
                <>
                  <div className="stat-row">
                    <span>스킬</span>
                    <span>{chapter.sessionSkills.length}</span>
                  </div>
                  <div className="stat-row" style={{ fontSize: 12, color: '#aaa' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Zap size={12} /> 중박 {chapter.jungbakCount}/{EncounterDataTable.counterThreshold.jungbak}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Star size={12} /> 대박 {chapter.daebakCount}/{EncounterDataTable.counterThreshold.daebak}
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          <AdventureStage
            isBattling={isBattling}
            playerUnit={playerUnit}
            enemyUnit={enemyUnit}
            attackPhase={attackPhase}
            damageEntries={damageEntries}
            turnCount={turnCount}
            maxTurns={MAX_BATTLE_TURNS}
            isBoss={isBossFight}
            encounterType={encounter?.type}
            encounterOptionLabel={encounter?.options[0]?.label}
          />

          {isBattling && playerUnit ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ flex: 1 }}>
                  <PlayerStatsBar
                    hp={playerUnit.currentHp}
                    maxHp={playerUnit.maxHp}
                    atk={playerUnit.getEffectiveAtk()}
                    def={playerUnit.getEffectiveDef()}
                  />
                </div>
                <button
                  className={`btn-icon ${showDamageGraph ? 'active' : ''}`}
                  onClick={() => setShowDamageGraph(v => !v)}
                  title="딜 그래프"
                >
                  <BarChart3 size={18} />
                </button>
              </div>
              {showDamageGraph && <DamageGraph sources={damageSourcesSnapshot} />}
            </>
          ) : (
            <PlayerStatsBar
              hp={chapter ? chapter.sessionCurrentHp : playerStats.hp}
              maxHp={chapter ? chapter.sessionMaxHp : playerStats.maxHp}
              atk={playerStats.atk}
              def={playerStats.def}
            />
          )}

          {encounter && !isBattling && (
            <>
              <div className="ba-day-divider">{chapter!.currentDay}일차</div>
              <h3>{EncounterDataTable.getLabel(encounter.type)}</h3>
              <div style={{ fontSize: 12, color: '#aaa', marginBottom: 8 }}>
                {EncounterDataTable.getDescription(encounter.type)}
              </div>
              <div className="encounter-options">
                {encounter.options.map((opt, i) => (
                  <div key={i} className="encounter-option" onClick={() => selectOption(i)}>
                    <div style={{ fontWeight: 'bold' }}>{opt.label}</div>
                    <div style={{ fontSize: 12, color: '#999' }}>{opt.description}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <button
            className="btn btn-secondary"
            style={{ width: '100%', marginTop: 12, color: '#ff5252' }}
            onClick={abandonChapter}
          >
            포기하기
          </button>
        </div>
      )}

      {chapterResult && !isBattling && (
        <div>
          <AdventureStage isBattling={false} />
          <div className="chapter-result-overlay">
            <div className={`chapter-result-icon ${chapterResult.type}`}>
              {chapterResult.type === 'victory' ? '🎉' : '💀'}
            </div>
            <div className={`chapter-result-title ${chapterResult.type}`}>
              {chapterResult.type === 'victory' ? '챕터 클리어!' : '챕터 실패'}
            </div>
            <div className="chapter-result-sub">
              챕터 {chapterResult.chapterId}
            </div>
            {chapterResult.gold > 0 && (
              <div className="chapter-result-reward">
                <span style={{ color: '#ffd700' }}>+{chapterResult.gold} G</span>
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16, width: '100%' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px 16px', fontSize: 15 }}
                onClick={() => { setChapterResult(null); setScreen('main'); }}
              >
                <Home size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                메인으로
              </button>
              {chapterResult.type === 'victory' && game.player.resources.stamina >= 5 && (
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', padding: '12px 16px', fontSize: 15 }}
                  onClick={() => { setChapterResult(null); startChapter(); }}
                >
                  <Swords size={16} style={{ marginRight: 6, verticalAlign: 'middle' }} />
                  다음 챕터 시작
                </button>
              )}
              <button
                className="btn btn-secondary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                onClick={() => { setChapterResult(null); setScreen('chapter-treasure'); }}
              >
                <Package size={16} />
                보물상자 확인
              </button>
            </div>
          </div>
        </div>
      )}

      {log.length > 0 && (
        <div className="battle-log" style={{ marginTop: 12 }}>
          {log.slice(-15).map((entry, i) => (
            <div key={i} className="log-entry">{entry}</div>
          ))}
        </div>
      )}
    </div>
  );
}
