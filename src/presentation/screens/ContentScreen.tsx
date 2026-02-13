import { useState } from 'react';
import { useGame } from '../GameContext';
import { DungeonType, ResourceType, BattleState } from '../../domain/enums';
import { BattleUnit } from '../../domain/battle/BattleUnit';

type ContentTab = 'menu' | 'tower' | 'dungeon' | 'arena' | 'travel' | 'mine';

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
    const playerUnit = new BattleUnit('Capybara', stats, [], true);
    const result = game.tower.challenge(playerUnit, tokens);
    if (result.isFail()) { showMsg(result.message); return; }

    game.player.resources.spend(ResourceType.CHALLENGE_TOKEN, 1);
    const battle = result.data!.battle;
    battle.runToCompletion();

    const outcome = game.tower.onBattleResult(battle.state);
    if (outcome.advanced) {
      for (const r of outcome.reward.resources) {
        game.player.resources.add(r.type, r.amount);
      }
      showMsg(`Victory! Floor ${game.tower.currentFloor}-${game.tower.currentStage}`);
    } else {
      showMsg('Defeat! Token not consumed.');
      game.player.resources.add(ResourceType.CHALLENGE_TOKEN, 1);
    }
    refresh();
  }

  function enterDungeon(type: DungeonType) {
    const result = game.enterDungeon(type);
    if (result.isFail()) { showMsg(result.message); return; }
    showMsg('Dungeon cleared! Rewards collected.');
    refresh();
  }

  function fightArena() {
    const stats = game.player.computeStats();
    const playerUnit = new BattleUnit('Capybara', stats, [], true);
    const result = game.arena.fight(playerUnit, game.player.resources.arenaTickets, game.rng);
    if (result.isFail()) { showMsg(result.message); return; }
    game.player.resources.spend(ResourceType.ARENA_TICKET, 1);
    const wins = result.data!.results.filter(r => r === BattleState.VICTORY).length;
    const reward = game.arena.getReward();
    for (const r of reward.resources) game.player.resources.add(r.type, r.amount);
    showMsg(`Arena: ${wins}/4 wins! Tier: ${game.arena.tier}`);
    refresh();
  }

  function runTravel() {
    const result = game.travelRun(10);
    if (result.isFail()) { showMsg(result.message); return; }
    showMsg(`Travel complete! +${result.data!.reward.resources[0]?.amount ?? 0} gold`);
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
        showMsg('Cart reward collected!');
      }
    } else {
      showMsg(`Mined! Ore: ${game.goblinMiner.oreCount}/30`);
    }
    refresh();
  }

  if (tab === 'menu') {
    return (
      <div className="screen">
        <h2>Content</h2>
        {message && <div className="card" style={{ color: '#4caf50' }}>{message}</div>}
        <div className="menu-grid">
          <div className="menu-card" onClick={() => setTab('tower')}>
            <div className="title">Tower</div>
            <div className="sub">F{game.tower.currentFloor}-{game.tower.currentStage}</div>
          </div>
          <div className="menu-card" onClick={() => setTab('dungeon')}>
            <div className="title">Dungeon</div>
            <div className="sub">{game.dungeonManager.getTotalRemainingCount()} remaining</div>
          </div>
          <div className="menu-card" onClick={() => setTab('arena')}>
            <div className="title">Arena</div>
            <div className="sub">{game.arena.tier} | {game.arena.getRemainingEntries()} entries</div>
          </div>
          <div className="menu-card" onClick={() => setTab('travel')}>
            <div className="title">Travel</div>
            <div className="sub">x{game.travel.multiplier}</div>
          </div>
          <div className="menu-card" onClick={() => setTab('mine')}>
            <div className="title">Mine</div>
            <div className="sub">{game.goblinMiner.oreCount}/30 ore</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen">
      <button className="btn btn-secondary" onClick={() => setTab('menu')}>Back</button>
      {message && <div className="card" style={{ color: '#4caf50' }}>{message}</div>}

      {tab === 'tower' && (
        <>
          <h2>Tower</h2>
          <div className="card">
            <div className="stat-row"><span>Floor</span><span>{game.tower.currentFloor}</span></div>
            <div className="stat-row"><span>Stage</span><span>{game.tower.currentStage}/10</span></div>
            <div className="stat-row"><span>Tokens</span><span>{game.player.resources.challengeTokens}</span></div>
          </div>
          <button className="btn btn-primary" onClick={challengeTower}
            disabled={game.player.resources.challengeTokens < 1}>
            Challenge
          </button>
        </>
      )}

      {tab === 'dungeon' && (
        <>
          <h2>Daily Dungeons</h2>
          {[DungeonType.DRAGON_NEST, DungeonType.CELESTIAL_TREE, DungeonType.SKY_ISLAND].map(type => {
            const d = game.dungeonManager.getDungeon(type);
            return (
              <div className="card" key={type}>
                <div className="card-header">
                  <span style={{ fontWeight: 'bold' }}>{type}</span>
                  <span style={{ fontSize: 12 }}>{d.getRemainingCount()}/{d.dailyLimit}</span>
                </div>
                <button className="btn btn-primary" onClick={() => enterDungeon(type)}
                  disabled={!d.isAvailable()}>
                  Enter
                </button>
              </div>
            );
          })}
        </>
      )}

      {tab === 'arena' && (
        <>
          <h2>Arena</h2>
          <div className="card">
            <div className="stat-row"><span>Tier</span><span>{game.arena.tier}</span></div>
            <div className="stat-row"><span>Points</span><span>{game.arena.points}</span></div>
            <div className="stat-row"><span>Entries</span><span>{game.arena.getRemainingEntries()}/5</span></div>
          </div>
          <button className="btn btn-primary" onClick={fightArena}
            disabled={!game.arena.isAvailable() || game.player.resources.arenaTickets < 1}>
            Fight
          </button>
        </>
      )}

      {tab === 'travel' && (
        <>
          <h2>Travel</h2>
          <div className="card">
            <div className="stat-row"><span>Max Chapter</span><span>{game.travel.maxClearedChapter}</span></div>
            <div className="stat-row"><span>Multiplier</span><span>x{game.travel.multiplier}</span></div>
            <div className="stat-row"><span>Preview (10 sta)</span><span>{game.travel.getGoldPreview(10)} gold</span></div>
          </div>
          <button className="btn btn-primary" onClick={runTravel}
            disabled={game.player.resources.stamina < 10}>
            Travel (10 stamina)
          </button>
        </>
      )}

      {tab === 'mine' && (
        <>
          <h2>Goblin Mine</h2>
          <div className="card">
            <div className="stat-row"><span>Ore</span><span>{game.goblinMiner.oreCount}/30</span></div>
            <div className="stat-row"><span>Pickaxes</span><span>{game.player.resources.pickaxes}</span></div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${game.goblinMiner.getProgress() * 100}%` }} />
            </div>
          </div>
          <button className="btn btn-primary" onClick={doMine}
            disabled={game.player.resources.pickaxes < 1}>
            Mine
          </button>
        </>
      )}
    </div>
  );
}
