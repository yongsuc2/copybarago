import { Heart, Sword, ShieldHalf } from 'lucide-react';

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(Math.floor(n));
}

export { formatNumber };

interface PlayerStatsBarProps {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
}

export function PlayerStatsBar({ hp, maxHp, atk, def }: PlayerStatsBarProps) {
  const hpPercent = maxHp > 0 ? Math.round((hp / maxHp) * 100) : 0;

  return (
    <div className="player-stats-bar">
      <div className="psb-item psb-hp">
        <Heart size={14} color="#e94560" fill="#e94560" />
        <span className="psb-label">체력</span>
        <span className="psb-hp-percent">{hpPercent}%</span>
        <span className="psb-hp-value">{formatNumber(hp)}/{formatNumber(maxHp)}</span>
      </div>
      <div className="psb-item">
        <Sword size={14} color="#ff9800" />
        <span className="psb-label">공격력</span>
        <span className="psb-value">{formatNumber(atk)}</span>
      </div>
      <div className="psb-item">
        <ShieldHalf size={14} color="#2196f3" />
        <span className="psb-label">방어력</span>
        <span className="psb-value">{formatNumber(def)}</span>
      </div>
    </div>
  );
}
