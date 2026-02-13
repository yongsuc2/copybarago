import type { Stats } from '../../domain/value-objects/Stats';

export function StatsDisplay({ stats, label }: { stats: Stats; label?: string }) {
  return (
    <div className="stats-display">
      {label && <h4>{label}</h4>}
      <div className="stat-row"><span>HP</span><span>{stats.hp} / {stats.maxHp}</span></div>
      <div className="stat-row"><span>ATK</span><span>{stats.atk}</span></div>
      <div className="stat-row"><span>DEF</span><span>{stats.def}</span></div>
      <div className="stat-row"><span>CRIT</span><span>{(stats.crit * 100).toFixed(1)}%</span></div>
    </div>
  );
}
