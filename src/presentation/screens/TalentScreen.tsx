import { useGame } from '../GameContext';
import { StatType, ResourceType } from '../../domain/enums';
import { StatsDisplay } from '../components/StatsDisplay';

export function TalentScreen() {
  const { game, refresh } = useGame();
  const talent = game.player.talent;
  const stats = game.player.computeStats();

  function upgradeStat(stat: StatType) {
    const cost = talent.getUpgradeCost(stat);
    if (!game.player.resources.canAfford(ResourceType.GOLD, cost)) return;

    const result = talent.upgrade(stat, game.player.resources.gold);
    if (result.isOk() && result.data) {
      game.player.resources.spend(ResourceType.GOLD, result.data.cost);
    }
    refresh();
  }

  const rows = [
    { stat: StatType.ATK, label: 'ATK', level: talent.atkLevel },
    { stat: StatType.HP, label: 'HP', level: talent.hpLevel },
    { stat: StatType.DEF, label: 'DEF', level: talent.defLevel },
  ];

  const nextThreshold = talent.getNextGradeThreshold();

  return (
    <div className="screen">
      <h2>Talent</h2>

      <div className="card">
        <div className="stat-row">
          <span>Grade</span>
          <span>{talent.grade}</span>
        </div>
        <div className="stat-row">
          <span>Total Level</span>
          <span>{talent.getTotalLevel()}</span>
        </div>
        {nextThreshold && (
          <>
            <div className="stat-row">
              <span>Next Grade</span>
              <span>{talent.getTotalLevel()} / {nextThreshold}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(talent.getTotalLevel() / nextThreshold) * 100}%` }} />
            </div>
          </>
        )}
      </div>

      {rows.map(row => {
        const cost = talent.getUpgradeCost(row.stat);
        const canAfford = game.player.resources.canAfford(ResourceType.GOLD, cost);

        return (
          <div className="talent-row" key={row.stat}>
            <div>
              <div style={{ fontWeight: 'bold' }}>{row.label}</div>
              <div style={{ fontSize: 12, color: '#888' }}>Lv.{row.level}</div>
            </div>
            <button
              className="btn btn-primary"
              disabled={!canAfford}
              onClick={() => upgradeStat(row.stat)}
            >
              Upgrade ({cost}g)
            </button>
          </div>
        );
      })}

      <StatsDisplay stats={stats} label="Total Stats" />

      {game.player.isHeritageUnlocked() && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>Heritage</h3>
          <div className="stat-row">
            <span>Route</span>
            <span>{game.player.heritage.route}</span>
          </div>
          <div className="stat-row">
            <span>Level</span>
            <span>{game.player.heritage.level}</span>
          </div>
        </div>
      )}
    </div>
  );
}
