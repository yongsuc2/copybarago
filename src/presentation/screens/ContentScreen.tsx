import { useState } from 'react';
import { useGame } from '../GameContext';
import { DungeonType, ResourceType, BattleState } from '../../domain/enums';
import { BattleUnit } from '../../domain/battle/BattleUnit';
import type { PassiveSkill } from '../../domain/entities/PassiveSkill';
import { ResourceDataTable } from '../../domain/data/ResourceDataTable';
import { Building2, Skull, Swords, Map, Pickaxe, ArrowLeft } from 'lucide-react';

type ContentTab = 'menu' | 'tower' | 'dungeon' | 'arena' | 'travel' | 'mine';

const DUNGEON_LABELS = ResourceDataTable.dungeonLabels;

export function ContentScreen() {
  const { game, refresh } = useGame();
  const [tab, setTab] = useState<ContentTab>('menu');
  const [message, setMessage] = useState('');

  function showMsg(msg: string) {
    setMessage(msg);
    setTimeout(() => setMessage(''), 2000);
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

  function enterDungeon(type: DungeonType) {
    const result = game.enterDungeon(type);
    if (result.isFail()) { showMsg(result.message); return; }
    game.updateQuestProgress('daily_dungeon');
    game.saveGame();
    showMsg('던전 클리어! 보상을 획득했습니다.');
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
      <button className="btn btn-secondary" onClick={() => setTab('menu')}><ArrowLeft size={14} style={{ verticalAlign: -2 }} /> 뒤로</button>
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

      {tab === 'dungeon' && (
        <>
          <h2>일일 던전</h2>
          {[DungeonType.DRAGON_NEST, DungeonType.CELESTIAL_TREE, DungeonType.SKY_ISLAND].map(type => {
            const d = game.dungeonManager.getDungeon(type);
            return (
              <div className="card" key={type}>
                <div className="card-header">
                  <span style={{ fontWeight: 'bold' }}>{DUNGEON_LABELS[type]}</span>
                  <span style={{ fontSize: 12 }}>{d.getRemainingCount()}/{d.dailyLimit}</span>
                </div>
                <button className="btn btn-primary" onClick={() => enterDungeon(type)}
                  disabled={!d.isAvailable()}>
                  입장
                </button>
              </div>
            );
          })}
        </>
      )}

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
