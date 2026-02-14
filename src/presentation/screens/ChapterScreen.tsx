import { useState, useEffect, useRef, useCallback } from 'react';
import { useGame } from '../GameContext';
import { ChapterType, EncounterType, BattleState } from '../../domain/enums';
import type { Encounter } from '../../domain/chapter/Encounter';
import { BattleUnit } from '../../domain/battle/BattleUnit';
import { Battle } from '../../domain/battle/Battle';
import type { BattleLogEntry } from '../../domain/battle/BattleLog';
import { BattleLogType } from '../../domain/battle/BattleLog';
import { BattleArena, type AttackPhase } from '../components/BattleArena';
import { PlayerStatsBar } from '../components/PlayerStatsBar';
import { Package } from 'lucide-react';

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

export function ChapterScreen() {
  const { game, refresh, setScreen } = useGame();
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [battleResult, setBattleResult] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const [battle, setBattle] = useState<Battle | null>(null);
  const [playerUnit, setPlayerUnit] = useState<BattleUnit | null>(null);
  const [enemyUnit, setEnemyUnit] = useState<BattleUnit | null>(null);
  const [attackPhase, setAttackPhase] = useState<AttackPhase>('idle');
  const [damageEntries, setDamageEntries] = useState<BattleLogEntry[]>([]);
  const [turnCount, setTurnCount] = useState(0);
  const [isBattling, setIsBattling] = useState(false);
  const [isBossFight, setIsBossFight] = useState(false);

  const cancelledRef = useRef(false);
  const battleRef = useRef<Battle | null>(null);

  const chapter = game.currentChapter;

  const finishBattle = useCallback((b: Battle, boss: boolean) => {
    if (boss) {
      if (b.state === BattleState.VICTORY) {
        game.currentChapter?.onBossDefeated();
        if (game.currentChapter) {
          game.player.clearedChapterMax = Math.max(game.player.clearedChapterMax, game.currentChapter.id);
          game.travel.maxClearedChapter = game.player.clearedChapterMax;
          game.player.resources.add('GOLD' as any, 500);
          setLog(prev => [...prev, `보스 클리어! 챕터 ${game.currentChapter!.id} 완료!`]);
        }
      } else {
        game.currentChapter?.onBattleEnd(b.state);
        setLog(prev => [...prev, `보스에게 패배했습니다...`]);
      }
      setBattleResult(b.state);
      if (game.currentChapter) {
        game.player.updateBestSurvivalDay(
          game.currentChapter.id,
          game.currentChapter.currentDay,
          game.currentChapter.isCompleted(),
        );
      }
      game.currentChapter = null;
    } else {
      game.currentChapter?.onBattleEnd(b.state);
      setLog(prev => [...prev, `  전투: ${b.state} (${b.turnCount}턴)`]);
      setBattleResult(b.state);

      if (b.state === BattleState.DEFEAT) {
        if (game.currentChapter) {
          game.player.updateBestSurvivalDay(
            game.currentChapter.id,
            game.currentChapter.currentDay,
            false,
          );
        }
        game.currentChapter = null;
      }
    }

    setTimeout(() => {
      setIsBattling(false);
      setBattle(null);
      setPlayerUnit(null);
      setEnemyUnit(null);
      setAttackPhase('idle');
      setDamageEntries([]);
      setTurnCount(0);
      battleRef.current = null;

      if (b.state === BattleState.VICTORY && !boss && game.currentChapter) {
        setEncounter(null);
        setTimeout(() => advanceDay(), 400);
      }

      refresh();
    }, 1500);
  }, [game, refresh]);

  const advanceDay = useCallback(() => {
    if (!game.currentChapter) return;

    if (game.currentChapter.isBossDay()) {
      startBossBattle();
      return;
    }

    const enc = game.currentChapter.advanceDay();
    setEncounter(enc);
    setLog(prev => [...prev, `${game.currentChapter!.currentDay}일차: ${enc?.type ?? '보스'}`]);
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

  async function animateTurn(b: Battle, playerName: string) {
    if (cancelledRef.current) return;

    const playerHpBefore = b.player.currentHp;
    const enemyHpBefore = b.enemy.currentHp;

    const result = b.executeTurn();
    setTurnCount(result.turnNumber);

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

    const midHp = computeMidTurnHp(
      playerHpBefore, enemyHpBefore,
      playerEntries, playerName,
      b.player.maxHp, b.enemy.maxHp,
    );

    if (playerEntries.length > 0 && !cancelledRef.current) {
      setAttackPhase('player-approach');
      await delay(PHASE_DURATION.approach);
      if (cancelledRef.current) return;

      setDamageEntries(playerEntries);
      const midPlayer = cloneUnit(b.player);
      midPlayer.currentHp = midHp.playerHp;
      const midEnemy = cloneUnit(b.enemy);
      midEnemy.currentHp = midHp.enemyHp;
      setPlayerUnit(midPlayer);
      setEnemyUnit(midEnemy);
      setAttackPhase('player-hit');
      await delay(PHASE_DURATION.hit);
      if (cancelledRef.current) return;

      setAttackPhase('player-retreat');
      await delay(PHASE_DURATION.retreat);
      if (cancelledRef.current) return;

      setDamageEntries([]);
      setAttackPhase('idle');
      await delay(PHASE_DURATION.pause);
      if (cancelledRef.current) return;
    }

    if (enemyEntries.length > 0 && !cancelledRef.current && b.enemy.isAlive()) {
      setAttackPhase('enemy-approach');
      await delay(PHASE_DURATION.approach);
      if (cancelledRef.current) return;

      setDamageEntries(enemyEntries);
      setPlayerUnit(cloneUnit(b.player));
      setEnemyUnit(cloneUnit(b.enemy));
      setAttackPhase('enemy-hit');
      await delay(PHASE_DURATION.hit);
      if (cancelledRef.current) return;

      setAttackPhase('enemy-retreat');
      await delay(PHASE_DURATION.retreat);
      if (cancelledRef.current) return;

      setDamageEntries([]);
      setAttackPhase('idle');
      await delay(PHASE_DURATION.pause);
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
    const pu = new BattleUnit('Capybara', stats, [...game.currentChapter.sessionSkills], true);
    const b = game.currentChapter.createBossBattle(pu);
    if (!b) return;

    startBattle(b, true);
  }

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

  function selectOption(index: number) {
    if (!game.currentChapter || !encounter) return;

    if (encounter.type === EncounterType.COMBAT && index === 0) {
      const stats = game.player.computeStats();
      const pu = new BattleUnit('Capybara', stats, [...game.currentChapter.sessionSkills], true);
      const b = game.currentChapter.createCombatBattle(pu);
      if (!b) return;
      startBattle(b, false);
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

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const playerStats = game.player.computeStats();

  return (
    <div className="screen">
      <h2>모험</h2>

      {!chapter && !isBattling && (
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
          {battleResult && (
            <div className={`battle-result-banner ${battleResult === BattleState.VICTORY ? 'victory' : 'defeat'}`}>
              {battleResult === BattleState.VICTORY ? '챕터 클리어!' : '챕터 실패'}
            </div>
          )}
        </div>
      )}

      {isBattling && playerUnit && enemyUnit && (
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
            </div>
          )}
          <BattleArena
            playerUnit={playerUnit}
            enemyUnit={enemyUnit}
            attackPhase={attackPhase}
            damageEntries={damageEntries}
            turnCount={turnCount}
            maxTurns={MAX_BATTLE_TURNS}
            isBoss={isBossFight}
          />
          <PlayerStatsBar
            hp={playerUnit.currentHp}
            maxHp={playerUnit.maxHp}
            atk={playerUnit.getEffectiveAtk()}
            def={playerUnit.getEffectiveDef()}
          />
        </div>
      )}

      {chapter && encounter && !isBattling && (
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

          <PlayerStatsBar
            hp={playerStats.hp}
            maxHp={playerStats.maxHp}
            atk={playerStats.atk}
            def={playerStats.def}
          />

          <div className="ba-day-divider">{chapter.currentDay}일차</div>

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
          {log.slice(-15).map((entry, i) => (
            <div key={i} className="log-entry">{entry}</div>
          ))}
        </div>
      )}
    </div>
  );
}
