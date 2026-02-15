import { formatNumber } from './PlayerStatsBar';

export interface DamageSource {
  label: string;
  icon: string;
  total: number;
}

interface DamageGraphProps {
  sources: DamageSource[];
  title?: string;
  variant?: 'damage' | 'heal';
}

export function DamageGraph({ sources, title = '딜 그래프', variant = 'damage' }: DamageGraphProps) {
  if (sources.length === 0) return null;

  const sorted = [...sources].sort((a, b) => b.total - a.total);
  const maxVal = sorted[0].total;
  const totalVal = sorted.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="damage-graph">
      <div className={`dg-header ${variant}`}>
        <span>{title}</span>
        <span style={{ color: '#aaa' }}>총 {formatNumber(totalVal)}</span>
      </div>
      {sorted.map((source, i) => {
        const pct = maxVal > 0 ? (source.total / maxVal) * 100 : 0;
        const sharePct = totalVal > 0 ? ((source.total / totalVal) * 100).toFixed(1) : '0';
        return (
          <div key={i} className="dg-row">
            <div className="dg-label">
              <span className="dg-icon">{source.icon}</span>
              <span className="dg-name">{source.label}</span>
            </div>
            <div className="dg-bar-wrap">
              <div className={`dg-bar-fill ${variant}`} style={{ width: `${pct}%` }} />
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
