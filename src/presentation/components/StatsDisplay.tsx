import type { Stats } from '../../domain/value-objects/Stats';

export function StatsDisplay({ stats, label }: { stats: Stats; label?: string }) {
  return (
    <div className="stats-display">
      {label && <h4>{label}</h4>}
      <div className="stat-row"><span>체력</span><span>{stats.hp} / {stats.maxHp}</span></div>
      <div className="stat-row"><span>공격력</span><span>{stats.atk}</span></div>
      <div className="stat-row"><span>방어력</span><span>{stats.def}</span></div>
      <div className="stat-row"><span>치명타</span><span>{(stats.crit * 100).toFixed(1)}%</span></div>
    </div>
  );
}
