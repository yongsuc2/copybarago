import { useState } from 'react';
import { useGame } from '../GameContext';
import { StatsDisplay } from '../components/StatsDisplay';
import { Swords, Castle, TrendingUp, Gift } from 'lucide-react';
import type { Player } from '../../domain/entities/Player';
import type { StatsBreakdown } from '../../domain/entities/Player';
import type { Stats } from '../../domain/value-objects/Stats';
import { formatNumber } from '../components/PlayerStatsBar';
import { TalentTable } from '../../domain/data/TalentTable';

const SOURCE_LABELS: { key: Exclude<keyof StatsBreakdown, 'total'>; label: string }[] = [
  { key: 'base', label: '기본' },
  { key: 'talent', label: '재능' },
  { key: 'grade', label: '등급' },
  { key: 'equipment', label: '장비' },
  { key: 'heritage', label: '유산' },
  { key: 'pet', label: '펫' },
];

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function StatBreakdownRows({ label, getter, breakdown, format }: {
  label: string;
  getter: (s: Stats) => number;
  breakdown: StatsBreakdown;
  format?: (v: number) => string;
}) {
  const fmt = format ?? formatNumber;
  const total = getter(breakdown.total);
  const subs = SOURCE_LABELS.filter(s => getter(breakdown[s.key]) !== 0);

  return (
    <div className="sd-stat-group">
      <div className="stat-row sd-total">
        <span>{label}</span>
        <span>{fmt(total)}</span>
      </div>
      {subs.map(s => (
        <div key={s.key} className="stat-row sd-sub">
          <span>{s.label}</span>
          <span>{fmt(getter(breakdown[s.key]))}</span>
        </div>
      ))}
    </div>
  );
}

function StatsDetailPopup({ player, onClose }: { player: Player; onClose: () => void }) {
  const breakdown = player.getStatsBreakdown();
  const combat = player.getCombatPassives();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="sd-popup" onClick={e => e.stopPropagation()}>
        <h3>상세 스탯</h3>

        <div className="sd-section">
          <h5>기본 스탯</h5>
          <StatBreakdownRows label="최대 체력" getter={s => s.maxHp} breakdown={breakdown} />
          <StatBreakdownRows label="공격력" getter={s => s.atk} breakdown={breakdown} />
          <StatBreakdownRows label="방어력" getter={s => s.def} breakdown={breakdown} />
          <StatBreakdownRows label="치명타 확률" getter={s => s.crit} breakdown={breakdown} format={pct} />
        </div>

        <div className="sd-section">
          <h5>전투 스탯</h5>
          <CombatStatRow label="치명타 데미지" value={`${(combat.critDamage * 100).toFixed(0)}%`} />
          <CombatStatRow label="흡혈률" value={pct(combat.lifestealRate)} />
          <CombatStatRow label="회피율" value={pct(combat.evasionRate)} />
          <CombatStatRow label="반격 확률" value={pct(combat.counterChance)} />
        </div>

        <button className="btn btn-primary w-full" onClick={onClose}>닫기</button>
      </div>
    </div>
  );
}

function CombatStatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="stat-row">
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

export function MainScreen() {
  const { game, setScreen } = useGame();
  const stats = game.player.computeStats();
  const [showDetail, setShowDetail] = useState(false);
  const subGradeLabel = TalentTable.getSubGradeLabel(game.player.talent.getTotalLevel());

  return (
    <div className="screen">
      <h2>카피바라 고!</h2>
      <div className="sd-stats-wrap">
        <StatsDisplay stats={stats} label="플레이어 스탯" />
        <button className="btn btn-secondary sd-detail-btn" onClick={() => setShowDetail(true)}>상세</button>
      </div>

      <div className="card">
        <div className="stat-row">
          <span>재능 등급</span>
          <span>{subGradeLabel}</span>
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

      {showDetail && <StatsDetailPopup player={game.player} onClose={() => setShowDetail(false)} />}
    </div>
  );
}
