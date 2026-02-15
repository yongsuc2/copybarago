import { formatNumber } from './PlayerStatsBar';

export interface DamageSource {
  label: string;
  icon: string;
  total: number;
}

interface DamageGraphProps {
  sources: DamageSource[];
}

export function DamageGraph({ sources }: DamageGraphProps) {
  if (sources.length === 0) return null;

  const sorted = [...sources].sort((a, b) => b.total - a.total);
  const maxDamage = sorted[0].total;
  const totalDamage = sorted.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="damage-graph">
      <div className="dg-header">
        <span>딜 그래프</span>
        <span style={{ color: '#aaa' }}>총 {formatNumber(totalDamage)}</span>
      </div>
      {sorted.map((source, i) => {
        const pct = maxDamage > 0 ? (source.total / maxDamage) * 100 : 0;
        const sharePct = totalDamage > 0 ? ((source.total / totalDamage) * 100).toFixed(1) : '0';
        return (
          <div key={i} className="dg-row">
            <div className="dg-label">
              <span className="dg-icon">{source.icon}</span>
              <span className="dg-name">{source.label}</span>
            </div>
            <div className="dg-bar-wrap">
              <div className="dg-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="dg-value">
              <span>{formatNumber(source.total)}</span>
              <span className="dg-pct">{sharePct}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
