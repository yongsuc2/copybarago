import { useGame } from '../GameContext';
import { StatsDisplay } from '../components/StatsDisplay';

export function MainScreen() {
  const { game, setScreen } = useGame();
  const stats = game.player.computeStats();

  return (
    <div className="screen">
      <h2>Capybara Go!</h2>
      <StatsDisplay stats={stats} label="Player Stats" />

      <div className="card">
        <div className="stat-row">
          <span>Talent Grade</span>
          <span>{game.player.talent.grade}</span>
        </div>
        <div className="stat-row">
          <span>Cleared Chapter</span>
          <span>{game.player.clearedChapterMax}</span>
        </div>
        <div className="stat-row">
          <span>Tower Floor</span>
          <span>{game.tower.currentFloor}-{game.tower.currentStage}</span>
        </div>
        <div className="stat-row">
          <span>Arena Tier</span>
          <span>{game.arena.tier}</span>
        </div>
      </div>

      <div className="menu-grid">
        <div className="menu-card" onClick={() => setScreen('chapter')}>
          <div className="title">Adventure</div>
          <div className="sub">Stamina: {Math.floor(game.player.resources.stamina)}</div>
        </div>
        <div className="menu-card" onClick={() => setScreen('content')}>
          <div className="title">Content</div>
          <div className="sub">Tower / Dungeon / PvP</div>
        </div>
        <div className="menu-card" onClick={() => setScreen('talent')}>
          <div className="title">Growth</div>
          <div className="sub">Talent / Heritage</div>
        </div>
        <div className="menu-card" onClick={() => setScreen('gacha')}>
          <div className="title">Gacha</div>
          <div className="sub">Gems: {Math.floor(game.player.resources.gems)}</div>
        </div>
      </div>
    </div>
  );
}
