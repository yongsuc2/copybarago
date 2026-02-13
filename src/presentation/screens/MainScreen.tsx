import { useGame } from '../GameContext';
import { StatsDisplay } from '../components/StatsDisplay';
import { Swords, Castle, TrendingUp, Gift } from 'lucide-react';

export function MainScreen() {
  const { game, setScreen } = useGame();
  const stats = game.player.computeStats();

  return (
    <div className="screen">
      <h2>Capybara Go!</h2>
      <StatsDisplay stats={stats} label="플레이어 스탯" />

      <div className="card">
        <div className="stat-row">
          <span>재능 등급</span>
          <span>{game.player.talent.grade}</span>
        </div>
        <div className="stat-row">
          <span>클리어 챕터</span>
          <span>{game.player.clearedChapterMax}</span>
        </div>
        <div className="stat-row">
          <span>탑 층수</span>
          <span>{game.tower.currentFloor}-{game.tower.currentStage}</span>
        </div>
        <div className="stat-row">
          <span>아레나 티어</span>
          <span>{game.arena.tier}</span>
        </div>
      </div>

      <div className="menu-grid">
        <div className="menu-card" onClick={() => setScreen('chapter')}>
          <Swords size={28} color="#e94560" />
          <div className="title">모험</div>
          <div className="sub">스태미나: {Math.floor(game.player.resources.stamina)}</div>
        </div>
        <div className="menu-card" onClick={() => setScreen('content')}>
          <Castle size={28} color="#2196f3" />
          <div className="title">콘텐츠</div>
          <div className="sub">탑 / 던전 / PvP</div>
        </div>
        <div className="menu-card" onClick={() => setScreen('talent')}>
          <TrendingUp size={28} color="#4caf50" />
          <div className="title">성장</div>
          <div className="sub">재능 / 유산</div>
        </div>
        <div className="menu-card" onClick={() => setScreen('gacha')}>
          <Gift size={28} color="#ff9800" />
          <div className="title">뽑기</div>
          <div className="sub">보석: {Math.floor(game.player.resources.gems)}</div>
        </div>
      </div>
    </div>
  );
}
