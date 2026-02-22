import { useGame } from '../GameContext';
import { StatType, ResourceType } from '../../domain/enums';
import { StatsDisplay } from '../components/StatsDisplay';
import { TalentTable } from '../../domain/data/TalentTable';

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
      game.saveGame();
    }
    refresh();
  }

  const rows = [
    { stat: StatType.ATK, label: '공격력', level: talent.atkLevel },
    { stat: StatType.HP, label: '체력', level: talent.hpLevel },
    { stat: StatType.DEF, label: '방어력', level: talent.defLevel },
  ];

  const nextThreshold = talent.getNextGradeThreshold();

  return (
    <div className="screen">
      <h2>재능</h2>

      <div className="card">
        <div className="stat-row">
          <span>등급</span>
          <span>{talent.grade}</span>
        </div>
        <div className="stat-row">
          <span>총 레벨</span>
          <span>{talent.getTotalLevel()}</span>
        </div>
        {nextThreshold && (
          <>
            <div className="stat-row">
              <span>다음 등급</span>
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
              <div style={{ fontSize: 12, color: '#888' }}>{row.level}레벨 (레벨당 +{TalentTable.getStatPerLevel(row.stat)})</div>
            </div>
            <button
              className="btn btn-primary"
              disabled={!canAfford}
              onClick={() => upgradeStat(row.stat)}
            >
              강화 ({cost}골드)
            </button>
          </div>
        );
      })}

      <StatsDisplay stats={stats} label="종합 스탯" />

      {game.player.isHeritageUnlocked() && (
        <div className="card" style={{ marginTop: 12 }}>
          <h3>유산</h3>
          <div className="stat-row">
            <span>경로</span>
            <span>{game.player.heritage.route}</span>
          </div>
          <div className="stat-row">
            <span>레벨</span>
            <span>{game.player.heritage.level}</span>
          </div>
        </div>
      )}
    </div>
  );
}
