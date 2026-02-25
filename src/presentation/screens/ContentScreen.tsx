import { useState, useRef } from 'react';
import { useGame } from '../GameContext';
import { DungeonType, ResourceType, BattleState } from '../../domain/enums';
import { BattleUnit } from '../../domain/battle/BattleUnit';
import { Battle } from '../../domain/battle/Battle';
import type { BattleLogEntry } from '../../domain/battle/BattleLog';
import { BattleLogType } from '../../domain/battle/BattleLog';
import type { AttackPhase } from '../components/BattleArena';
import { BattleArena } from '../components/BattleArena';
import { formatNumber } from '../components/PlayerStatsBar';
import type { PassiveSkill } from '../../domain/entities/PassiveSkill';
import type { Reward } from '../../domain/value-objects/Reward';
import { ResourceDataTable } from '../../domain/data/ResourceDataTable';
import { BattleDataTable } from '../../domain/data/BattleDataTable';
import { Building2, Skull, Swords, Map, Pickaxe, ArrowLeft } from 'lucide-react';

type ContentTab = 'menu' | 'tower' | 'dungeon' | 'arena' | 'travel' | 'mine';
type DungeonPhase = 'select' | 'battling' | 'result' | 'sweep-result';

const DUNGEON_LABELS = ResourceDataTable.dungeonLabels;
const MAX_BATTLE_TURNS = BattleDataTable.maxTurns;

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
    || type === BattleLogType.RAGE_ATTACK
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

interface RunningHps {
  playerHp: number;
  enemyHp: number;
}

export function ContentScreen() {
  const { game, refresh } = useGame();
  const [tab, setTab] = useState<ContentTab>('menu');
  const [message, setMessage] = useState('');

  const [dungeonPhase, setDungeonPhase] = useState<DungeonPhase>('select');
  const [activeDungeonType, setActiveDungeonType] = useState<DungeonType | null>(null);
  const [dPlayerUnit, setDPlayerUnit] = useState<BattleUnit | null>(null);
  const [dEnemyUnits, setDEnemyUnits] = useState<BattleUnit[]>([]);
  const [dAttackPhase, setDAttackPhase] = useState<AttackPhase>('idle');
  const [dDamageEntries, setDDamageEntries] = useState<BattleLogEntry[]>([]);
  const [dTurnCount, setDTurnCount] = useState(0);
  const [dBattleState, setDBattleState] = useState<BattleState>(BattleState.IN_PROGRESS);
  const [dReward, setDReward] = useState<Reward | null>(null);
  const cancelledRef = useRef(false);

  function showMsg(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2000);
  }

  function computeMidTurnHp(
    hpsBefore: RunningHps,
    entries: BattleLogEntry[],
    playerName: string,
    playerMaxHp: number,
    enemyName: string,
    enemyMaxHp: number,
  ): RunningHps {
    let playerHp = hpsBefore.playerHp;
    let enemyHp = hpsBefore.enemyHp;

    for (const entry of entries) {
      const isHeal = entry.type === BattleLogType.LIFESTEAL
        || entry.type === BattleLogType.HOT_HEAL
        || entry.type === BattleLogType.REVIVE;
      if (isHeal) {
        if (entry.target === playerName) playerHp += entry.value;
        else if (entry.target === enemyName) enemyHp += entry.value;
      } else {
        if (entry.target === playerName) playerHp -= entry.value;
        else if (entry.target === enemyName) enemyHp -= entry.value;
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
    runningHps: RunningHps,
    b: Battle,
    playerName: string,
    enemyName: string,
    prevPlayer: BattleUnit,
    prevEnemy: BattleUnit,
  ): Promise<{ hps: RunningHps; player: BattleUnit; enemy: BattleUnit }> {
    const newHps = computeMidTurnHp(
      runningHps, hitGroup, playerName,
      b.player.maxHp, enemyName, b.enemy.maxHp,
    );

    const hasSkillProjectile = hitGroup.some(e =>
      (e.type === BattleLogType.SKILL_DAMAGE || e.type === BattleLogType.CRIT)
      && e.skillIcon && e.skillName !== '일반 공격',
    );
    if (hasSkillProjectile) {
      setDDamageEntries(hitGroup);
    }

    setDAttackPhase(`${side}-approach`);
    await delay(PHASE_DURATION.approach);
    if (cancelledRef.current) return { hps: newHps, player: prevPlayer, enemy: prevEnemy };

    if (!hasSkillProjectile) {
      setDDamageEntries(hitGroup);
    }
    const midPlayer = cloneUnit(prevPlayer);
    midPlayer.currentHp = newHps.playerHp;

    const midEnemy = cloneUnit(prevEnemy);
    midEnemy.currentHp = newHps.enemyHp;

    if (side === 'player') {
      midPlayer.rage = b.player.rage;
    } else {
      midEnemy.rage = b.enemy.rage;
    }

    setDPlayerUnit(midPlayer);
    setDEnemyUnits([midEnemy]);
    setDAttackPhase(`${side}-hit`);
    await delay(PHASE_DURATION.hit);
    if (cancelledRef.current) return { hps: newHps, player: midPlayer, enemy: midEnemy };

    setDAttackPhase(`${side}-retreat`);
    await delay(PHASE_DURATION.retreat);
    if (cancelledRef.current) return { hps: newHps, player: midPlayer, enemy: midEnemy };

    setDDamageEntries([]);
    setDAttackPhase('idle');
    await delay(PHASE_DURATION.pause);

    return { hps: newHps, player: midPlayer, enemy: midEnemy };
  }

  async function animateTurn(b: Battle, playerName: string, enemyName: string) {
    if (cancelledRef.current) return;

    const prevPlayerRage = b.player.rage;
    const prevEnemyRage = b.enemy.rage;

    const result = b.executeTurn();
    setDTurnCount(result.turnNumber);

    const playerEntries: BattleLogEntry[] = [];
    const enemyEntries: BattleLogEntry[] = [];
    const statusEntries: BattleLogEntry[] = [];

    for (const entry of result.entries) {
      if (!isDamageOrHeal(entry.type)) continue;
      if (entry.type === BattleLogType.DOT_DAMAGE || entry.type === BattleLogType.HOT_HEAL) {
        statusEntries.push(entry);
      } else if (entry.source === playerName) {
        playerEntries.push(entry);
      } else {
        enemyEntries.push(entry);
      }
    }

    let running: RunningHps = {
      playerHp: b.player.currentHp,
      enemyHp: b.enemy.currentHp,
    };

    for (const entry of result.entries) {
      if (!isDamageOrHeal(entry.type)) continue;
      const isHeal = entry.type === BattleLogType.LIFESTEAL || entry.type === BattleLogType.HOT_HEAL || entry.type === BattleLogType.REVIVE;
      if (entry.target === playerName) running.playerHp += isHeal ? -entry.value : entry.value;
      if (entry.target === enemyName) running.enemyHp += isHeal ? -entry.value : entry.value;
    }
    running.playerHp = Math.max(0, running.playerHp);
    running.enemyHp = Math.max(0, running.enemyHp);

    let curPlayer = cloneUnit(b.player);
    let curEnemy = cloneUnit(b.enemy);
    curPlayer.rage = prevPlayerRage;
    curEnemy.rage = prevEnemyRage;

    if (playerEntries.length > 0 && !cancelledRef.current) {
      const groups = splitToAnimationGroups(playerEntries);
      for (const group of groups) {
        if (cancelledRef.current) break;
        if (running.enemyHp <= 0) break;
        const res = await animateHitGroup(group, 'player', running, b, playerName, enemyName, curPlayer, curEnemy);
        running = res.hps;
        curPlayer = res.player;
        curEnemy = res.enemy;
      }
    }

    if (enemyEntries.length > 0 && !cancelledRef.current && running.playerHp > 0) {
      const groups = splitToAnimationGroups(enemyEntries);
      for (const group of groups) {
        if (cancelledRef.current || running.playerHp <= 0) break;
        const res = await animateHitGroup(group, 'enemy', running, b, playerName, enemyName, curPlayer, curEnemy);
        running = res.hps;
        curPlayer = res.player;
        curEnemy = res.enemy;
      }
    }

    if (statusEntries.length > 0 && !cancelledRef.current) {
      const newHps = computeMidTurnHp(
        running, statusEntries, playerName,
        b.player.maxHp, enemyName, b.enemy.maxHp,
      );
      running = newHps;

      const midPlayer = cloneUnit(curPlayer);
      midPlayer.currentHp = newHps.playerHp;
      const midEnemy = cloneUnit(curEnemy);
      midEnemy.currentHp = newHps.enemyHp;

      setDDamageEntries(statusEntries);
      setDPlayerUnit(midPlayer);
      setDEnemyUnits([midEnemy]);
      setDAttackPhase('idle');
      await delay(PHASE_DURATION.hit);
      setDDamageEntries([]);
      await delay(PHASE_DURATION.pause);

      curPlayer = midPlayer;
      curEnemy = midEnemy;
    }

    if (playerEntries.length === 0 && enemyEntries.length === 0 && statusEntries.length === 0) {
      await delay(PHASE_DURATION.pause);
    }

    setDPlayerUnit(cloneUnit(b.player));
    setDEnemyUnits([cloneUnit(b.enemy)]);
  }

  async function runDungeonBattle(b: Battle) {
    const playerName = b.player.name;
    const enemyName = b.enemy.name;

    while (!cancelledRef.current && !b.isFinished() && b.turnCount < MAX_BATTLE_TURNS) {
      await animateTurn(b, playerName, enemyName);
    }

    if (cancelledRef.current) return;

    if (b.state === BattleState.IN_PROGRESS) {
      (b as any).state = BattleState.DEFEAT;
    }

    setDBattleState(b.state);

    if (b.state === BattleState.VICTORY && activeDungeonType) {
      const reward = game.onDungeonBattleResult(activeDungeonType, BattleState.VICTORY);
      setDReward(reward);
    } else {
      setDReward(null);
    }

    game.updateQuestProgress('daily_dungeon');
    game.saveGame();
    refresh();
    setDungeonPhase('result');
  }

  function handleChallengeDungeon(type: DungeonType) {
    const result = game.challengeDungeon(type);
    if (result.isFail()) { showMsg(result.message); refresh(); return; }

    const battle = result.data!.battle;
    setActiveDungeonType(type);
    cancelledRef.current = false;
    setDPlayerUnit(cloneUnit(battle.player));
    setDEnemyUnits([cloneUnit(battle.enemy)]);
    setDAttackPhase('idle');
    setDDamageEntries([]);
    setDTurnCount(0);
    setDBattleState(BattleState.IN_PROGRESS);
    setDReward(null);
    setDungeonPhase('battling');

    runDungeonBattle(battle);
  }

  function handleSweepDungeon(type: DungeonType) {
    const result = game.sweepDungeon(type);
    if (result.isFail()) { showMsg(result.message); refresh(); return; }
    setActiveDungeonType(type);
    setDReward(result.data!.reward);
    game.updateQuestProgress('daily_dungeon');
    game.saveGame();
    refresh();
    setDungeonPhase('sweep-result');
  }

  function handleDungeonBack() {
    cancelledRef.current = true;
    setDungeonPhase('select');
    setActiveDungeonType(null);
    setDPlayerUnit(null);
    setDEnemyUnits([]);
    setDAttackPhase('idle');
    setDDamageEntries([]);
    setDReward(null);
  }

  function challengeTower() {
    const tokens = game.player.resources.challengeTokens;
    const stats = game.player.computeStats();
    const petAbility = game.battleManager.getPetAbilitySkill(game.player);
    const allPassives: PassiveSkill[] = [];
    if (petAbility) allPassives.push(petAbility);
    const playerUnit = new BattleUnit('Capybara', stats, [], allPassives, true);
    const result = game.tower.challenge(playerUnit, tokens);
    if (result.isFail()) { showMsg(result.message); return; }

    game.player.resources.spend(ResourceType.CHALLENGE_TOKEN, 1);
    const battle = result.data!.battle;
    battle.runToCompletion();

    const outcome = game.tower.onBattleResult(battle.state);
    game.updateQuestProgress('daily_tower');
    game.updateQuestProgress('weekly_tower');
    if (outcome.advanced) {
      for (const r of outcome.reward.resources) {
        game.player.resources.add(r.type, r.amount);
      }
      showMsg(`승리! ${game.tower.currentFloor}층-${game.tower.currentStage}`);
    } else {
      showMsg('패배! 토큰이 소모되지 않았습니다.');
      game.player.resources.add(ResourceType.CHALLENGE_TOKEN, 1);
    }
    game.saveGame();
    refresh();
  }

  function fightArena() {
    const stats = game.player.computeStats();
    const petAbility = game.battleManager.getPetAbilitySkill(game.player);
    const arenaPassives: PassiveSkill[] = [];
    if (petAbility) arenaPassives.push(petAbility);
    const playerUnit = new BattleUnit('Capybara', stats, [], arenaPassives, true);
    const result = game.arena.fight(playerUnit, game.player.resources.arenaTickets, game.rng);
    if (result.isFail()) { showMsg(result.message); return; }
    game.player.resources.spend(ResourceType.ARENA_TICKET, 1);
    game.updateQuestProgress('daily_arena');
    const wins = result.data!.results.filter(r => r === BattleState.VICTORY).length;
    const reward = game.arena.getReward();
    for (const r of reward.resources) game.player.resources.add(r.type, r.amount);
    showMsg(`아레나: ${wins}/4 승! 티어: ${game.arena.tier}`);
    game.saveGame();
    refresh();
  }

  function runTravel() {
    const result = game.travelRun(10);
    if (result.isFail()) { showMsg(result.message); return; }
    game.updateQuestProgress('daily_travel');
    showMsg(`여행 완료! +${result.data!.reward.resources[0]?.amount ?? 0} 골드`);
    game.saveGame();
    refresh();
  }

  function doMine() {
    const pickaxes = game.player.resources.pickaxes;
    const result = game.goblinMiner.mine(pickaxes);
    if (result.isFail()) { showMsg(result.message); return; }
    game.player.resources.spend(ResourceType.PICKAXE, 1);

    if (game.goblinMiner.canUseCart()) {
      const cartResult = game.goblinMiner.useCart(game.rng);
      if (cartResult.isOk()) {
        for (const r of cartResult.data!.reward.resources) game.player.resources.add(r.type, r.amount);
        showMsg('수레 보상을 획득했습니다!');
      }
    } else {
      showMsg(`채굴 완료! 광석: ${game.goblinMiner.oreCount}/30`);
    }
    game.saveGame();
    refresh();
  }

  function renderDungeonSelect() {
    const remaining = game.dungeonManager.getRemainingCount();
    return (
      <>
        <h2>일일 던전</h2>
        <div className="card" style={{ textAlign: 'center', padding: '6px 0' }}>
          <span style={{ fontSize: 13, color: remaining > 0 ? '#4caf50' : '#e94560' }}>
            남은 도전 횟수: {remaining}/{game.dungeonManager.dailyLimit}
          </span>
        </div>
        {[DungeonType.DRAGON_NEST, DungeonType.CELESTIAL_TREE, DungeonType.SKY_ISLAND].map(type => {
          const d = game.dungeonManager.getDungeon(type);
          const rewardPreview = d.getRewardPreview();
          return (
            <div className="card" key={type} style={{ padding: '10px 12px' }}>
              <div className="card-header" style={{ marginBottom: 6 }}>
                <span style={{ fontWeight: 'bold' }}>{DUNGEON_LABELS[type]}</span>
                <span style={{ fontSize: 12, color: '#aaa' }}>스테이지 {d.clearedStage}</span>
              </div>
              <div style={{ fontSize: 12, color: '#999', marginBottom: 8 }}>
                다음 보상:{' '}
                {rewardPreview.map((r, i) => (
                  <span key={i}>
                    {i > 0 && ', '}
                    {ResourceDataTable.getLabel(r.type)} {formatNumber(r.amount)}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => handleChallengeDungeon(type)}
                  disabled={!game.dungeonManager.isAvailable()}
                >
                  도전 (Stage {d.getNextStage()})
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  onClick={() => handleSweepDungeon(type)}
                  disabled={!game.dungeonManager.isAvailable() || d.clearedStage <= 0}
                >
                  소탕 ({d.clearedStage}단계)
                </button>
              </div>
            </div>
          );
        })}
      </>
    );
  }

  function renderDungeonBattle() {
    if (!dPlayerUnit || dEnemyUnits.length === 0) return null;
    return (
      <>
        <h2 style={{ marginBottom: 4 }}>
          {activeDungeonType ? DUNGEON_LABELS[activeDungeonType] : '던전'}
        </h2>
        <BattleArena
          playerUnit={dPlayerUnit}
          enemyUnits={dEnemyUnits}
          attackPhase={dAttackPhase}
          damageEntries={dDamageEntries}
          turnCount={dTurnCount}
          maxTurns={MAX_BATTLE_TURNS}
          isBoss={true}
          battleLabel={activeDungeonType ? DUNGEON_LABELS[activeDungeonType] : undefined}
        />
      </>
    );
  }

  function renderDungeonResult() {
    const isVictory = dBattleState === BattleState.VICTORY;
    return (
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: isVictory ? '#4caf50' : '#e94560', marginBottom: 8 }}>
          {isVictory ? '승리!' : '패배'}
        </h2>
        {isVictory && dReward && (
          <div className="card" style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 6 }}>보상</div>
            {dReward.resources.map((r, i) => (
              <div key={i} className="stat-row">
                <span>{ResourceDataTable.getLabel(r.type)}</span>
                <span style={{ color: '#4caf50' }}>+{formatNumber(r.amount)}</span>
              </div>
            ))}
          </div>
        )}
        {!isVictory && (
          <div className="card" style={{ color: '#aaa' }}>
            더 강해진 후 다시 도전하세요!
          </div>
        )}
        <button className="btn btn-primary" onClick={handleDungeonBack} style={{ marginTop: 8 }}>
          확인
        </button>
      </div>
    );
  }

  function renderSweepResult() {
    return (
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#ff9800', marginBottom: 8 }}>소탕 완료!</h2>
        {dReward && (
          <div className="card" style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', marginBottom: 6 }}>
              {activeDungeonType ? DUNGEON_LABELS[activeDungeonType] : '던전'} 소탕 보상
            </div>
            {dReward.resources.map((r, i) => (
              <div key={i} className="stat-row">
                <span>{ResourceDataTable.getLabel(r.type)}</span>
                <span style={{ color: '#4caf50' }}>+{formatNumber(r.amount)}</span>
              </div>
            ))}
          </div>
        )}
        <button className="btn btn-primary" onClick={handleDungeonBack} style={{ marginTop: 8 }}>
          확인
        </button>
      </div>
    );
  }

  if (tab === 'menu') {
    return (
      <div className="screen">
        <h2>콘텐츠</h2>
        {message && <div className="card" style={{ color: '#4caf50' }}>{message}</div>}
        <div className="menu-grid">
          <div className="menu-card" onClick={() => setTab('tower')}>
            <Building2 size={28} color="#9c27b0" />
            <div className="title">탑</div>
            <div className="sub">{game.tower.currentFloor}층-{game.tower.currentStage}</div>
          </div>
          <div className="menu-card" onClick={() => setTab('dungeon')}>
            <Skull size={28} color="#e94560" />
            <div className="title">던전</div>
            <div className="sub">{game.dungeonManager.getTotalRemainingCount()}회 남음</div>
          </div>
          <div className="menu-card" onClick={() => setTab('arena')}>
            <Swords size={28} color="#ff9800" />
            <div className="title">아레나</div>
            <div className="sub">{game.arena.tier} | {game.arena.getRemainingEntries()}회 남음</div>
          </div>
          <div className="menu-card" onClick={() => setTab('travel')}>
            <Map size={28} color="#4caf50" />
            <div className="title">여행</div>
            <div className="sub">x{game.travel.multiplier}</div>
          </div>
          <div className="menu-card" onClick={() => setTab('mine')}>
            <Pickaxe size={28} color="#ffd700" />
            <div className="title">광산</div>
            <div className="sub">광석 {game.goblinMiner.oreCount}/30</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      {tab === 'dungeon' && dungeonPhase === 'battling' ? null : (
        <button className="btn btn-secondary" onClick={() => {
          if (tab === 'dungeon' && dungeonPhase !== 'select') {
            handleDungeonBack();
          } else {
            setTab('menu');
          }
        }}>
          <ArrowLeft size={14} style={{ verticalAlign: -2 }} /> 뒤로
        </button>
      )}
      {message && <div className="card" style={{ color: '#4caf50' }}>{message}</div>}

      {tab === 'tower' && (
        <>
          <h2>탑</h2>
          <div className="card">
            <div className="stat-row"><span>층</span><span>{game.tower.currentFloor}</span></div>
            <div className="stat-row"><span>스테이지</span><span>{game.tower.currentStage}/10</span></div>
            <div className="stat-row"><span>토큰</span><span>{game.player.resources.challengeTokens}</span></div>
          </div>
          <button className="btn btn-primary" onClick={challengeTower}
            disabled={game.player.resources.challengeTokens < 1}>
            도전
          </button>
        </>
      )}

      {tab === 'dungeon' && dungeonPhase === 'select' && renderDungeonSelect()}
      {tab === 'dungeon' && dungeonPhase === 'battling' && renderDungeonBattle()}
      {tab === 'dungeon' && dungeonPhase === 'result' && renderDungeonResult()}
      {tab === 'dungeon' && dungeonPhase === 'sweep-result' && renderSweepResult()}

      {tab === 'arena' && (
        <>
          <h2>아레나</h2>
          <div className="card">
            <div className="stat-row"><span>티어</span><span>{game.arena.tier}</span></div>
            <div className="stat-row"><span>점수</span><span>{game.arena.points}</span></div>
            <div className="stat-row"><span>남은 횟수</span><span>{game.arena.getRemainingEntries()}/5</span></div>
          </div>
          <button className="btn btn-primary" onClick={fightArena}
            disabled={!game.arena.isAvailable() || game.player.resources.arenaTickets < 1}>
            전투
          </button>
        </>
      )}

      {tab === 'travel' && (
        <>
          <h2>여행</h2>
          <div className="card">
            <div className="stat-row"><span>최대 클리어 챕터</span><span>{game.travel.maxClearedChapter}</span></div>
            <div className="stat-row"><span>배율</span><span>x{game.travel.multiplier}</span></div>
            <div className="stat-row"><span>예상 수익 (10 스태미나)</span><span>{game.travel.getGoldPreview(10)} 골드</span></div>
          </div>
          <button className="btn btn-primary" onClick={runTravel}
            disabled={game.player.resources.stamina < 10}>
            여행 (10 스태미나)
          </button>
        </>
      )}

      {tab === 'mine' && (
        <>
          <h2>고블린 광산</h2>
          <div className="card">
            <div className="stat-row"><span>광석</span><span>{game.goblinMiner.oreCount}/30</span></div>
            <div className="stat-row"><span>곡괭이</span><span>{game.player.resources.pickaxes}</span></div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${game.goblinMiner.getProgress() * 100}%` }} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={doMine}
            disabled={game.player.resources.pickaxes < 1}>
            채굴
          </button>
        </>
      )}
    </div>
  );
}
