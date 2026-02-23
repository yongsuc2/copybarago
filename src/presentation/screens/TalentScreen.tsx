import { useState, useRef, useEffect } from 'react';
import { useGame } from '../GameContext';
import { StatType, ResourceType, TalentGrade } from '../../domain/enums';
import { TalentTable } from '../../domain/data/TalentTable';
import type { TalentMilestone, MilestoneRewardType } from '../../domain/data/TalentTable';

const GRADE_LABELS: Record<TalentGrade, string> = {
  [TalentGrade.DISCIPLE]: '수련생',
  [TalentGrade.ADVENTURER]: '모험가',
  [TalentGrade.ELITE]: '정예',
  [TalentGrade.MASTER]: '달인',
  [TalentGrade.WARRIOR]: '전사',
  [TalentGrade.HERO]: '영웅',
};

const REWARD_ICONS: Partial<Record<MilestoneRewardType, string>> = {
  [ResourceType.GOLD]: '🪙',
  GOLD_BOOST: '📈',
};

const REWARD_LABELS: Partial<Record<MilestoneRewardType, string>> = {
  [ResourceType.GOLD]: '골드',
  GOLD_BOOST: '골드 획득량',
};

const STAT_ICONS: Record<StatType, string> = {
  [StatType.ATK]: '⚔️',
  [StatType.HP]: '❤️',
  [StatType.DEF]: '🛡️',
  [StatType.CRIT]: '🎯',
};

const STAT_LABELS: Record<string, string> = {
  ATK: '공격력',
  DEF: '방어력',
  HP: '체력',
  CRIT: '치명타',
};

function formatRewardAmount(type: MilestoneRewardType, amount: number): string {
  if (type === 'GOLD_BOOST') return `+${amount}%`;
  if (amount >= 10000) return `x${(amount / 1000).toFixed(1)}K`;
  if (amount >= 1000) return `x${amount.toLocaleString()}`;
  return `x${amount}`;
}

type TrackNode =
  | { type: 'reward'; level: number; milestone: TalentMilestone }
  | { type: 'grade_up'; level: number; grade: TalentGrade; bonus: { stat: string; amount: number } | null };

function buildAllNodes(): TrackNode[] {
  const nodes: TrackNode[] = [];

  for (const m of TalentTable.getAllMilestones()) {
    nodes.push({ type: 'reward', level: m.level, milestone: m });
  }

  for (const g of TalentTable.getGradeOrder()) {
    const level = TalentTable.getGradeStartLevel(g);
    if (level === 0) continue;
    nodes.push({
      type: 'grade_up',
      level,
      grade: g,
      bonus: TalentTable.getIndividualGradeBonus(g),
    });
  }

  nodes.sort((a, b) => a.level - b.level);
  return nodes;
}

const ALL_NODES = buildAllNodes();
const MAX_LEVEL = TalentTable.getGradeStartLevel(
  TalentTable.getGradeOrder()[TalentTable.getGradeOrder().length - 1],
);

export function TalentScreen() {
  const { game, refresh } = useGame();
  const talent = game.player.talent;
  const [claimedReward, setClaimedReward] = useState<TalentMilestone | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalLevel = talent.getTotalLevel();
  const nextThreshold = talent.getNextGradeThreshold();
  const goldBoostPct = Math.round((game.player.getGoldMultiplier() - 1) * 100);

  const firstUnclaimed = ALL_NODES.find(n =>
    n.type === 'reward' &&
    totalLevel >= n.level &&
    !game.player.claimedMilestones.has(`LV_${n.level}`),
  );
  const scrollTargetLevel = firstUnclaimed ? firstUnclaimed.level : Math.min(totalLevel, MAX_LEVEL);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const targetPct = Math.min(scrollTargetLevel / MAX_LEVEL, 1);
    const targetPx = targetPct * el.scrollWidth;
    el.scrollLeft = Math.max(0, targetPx - el.clientWidth / 2);
  }, [scrollTargetLevel]);

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

  function claimMilestone(milestone: TalentMilestone) {
    const key = talent.getMilestoneKey(milestone.level);
    if (game.player.claimedMilestones.has(key)) return;
    game.player.claimedMilestones.add(key);
    if (milestone.rewardType !== 'GOLD_BOOST') {
      game.player.resources.add(milestone.rewardType, milestone.rewardAmount);
    }
    setClaimedReward(milestone);
    game.saveGame();
    refresh();
  }

  const rows = [
    { stat: StatType.ATK, label: '공격력', level: talent.atkLevel },
    { stat: StatType.HP, label: '체력', level: talent.hpLevel },
    { stat: StatType.DEF, label: '방어력', level: talent.defLevel },
  ];

  const progress = Math.min(totalLevel / MAX_LEVEL, 1) * 100;

  return (
    <div className="screen">
      <h2>재능</h2>

      <div className="card">
        <div className="stat-row">
          <span>등급</span>
          <span>{GRADE_LABELS[talent.grade] ?? talent.grade}</span>
        </div>
        <div className="stat-row">
          <span>총 레벨</span>
          <span>{totalLevel}{nextThreshold ? ` / ${nextThreshold}` : ''}</span>
        </div>
        {goldBoostPct > 0 && (
          <div className="stat-row">
            <span>골드 획득량</span>
            <span style={{ color: 'var(--color-gold)' }}>+{goldBoostPct}%</span>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 8 }}>
        <h3>등급 보상</h3>
        <div className="ms-scroll" ref={scrollRef}>
          <div className="ms-track" style={{ minWidth: ALL_NODES.length * 48 }}>
            <div className="ms-markers">
              {ALL_NODES.map(node => {
                const pct = (node.level / MAX_LEVEL) * 100;
                const reached = totalLevel >= node.level;

                if (node.type === 'grade_up') {
                  return (
                    <div key={`g_${node.level}`} className="ms-marker" style={{ left: `${pct}%` }}>
                      <div className={`ms-icon grade-up ${reached ? 'reached' : 'locked'}`}>
                        ⬆
                      </div>
                      <div className={`ms-amount ${reached ? '' : 'locked'}`}>
                        {GRADE_LABELS[node.grade]}
                      </div>
                    </div>
                  );
                }

                const m = node.milestone;
                const key = talent.getMilestoneKey(m.level);
                const claimed = game.player.claimedMilestones.has(key);
                const state = claimed ? 'claimed' : reached ? 'claimable' : 'locked';

                return (
                  <div key={`m_${node.level}`} className="ms-marker" style={{ left: `${pct}%` }}>
                    <div
                      className={`ms-icon ${state}`}
                      onClick={() => state === 'claimable' && claimMilestone(m)}
                    >
                      {REWARD_ICONS[m.rewardType] ?? '?'}
                      {claimed && <span className="ms-check">✓</span>}
                    </div>
                    <div className={`ms-amount ${state}`}>
                      {formatRewardAmount(m.rewardType, m.rewardAmount)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="ms-bar">
              <div className="ms-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="ms-labels">
              <span>Lv.0</span>
              <span>Lv.{MAX_LEVEL}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="talent-upgrades">
        {rows.map(row => {
          const cost = talent.getUpgradeCost(row.stat);
          const canAfford = game.player.resources.canAfford(ResourceType.GOLD, cost);
          const perLevel = TalentTable.getStatPerLevel(row.stat);

          return (
            <button
              key={row.stat}
              className="talent-btn"
              disabled={!canAfford}
              onClick={() => upgradeStat(row.stat)}
            >
              <span style={{ fontSize: 24 }}>{STAT_ICONS[row.stat]}</span>
              <span style={{ fontWeight: 'bold', fontSize: 13 }}>{row.label}</span>
              <span style={{ fontSize: 11, color: '#888' }}>Lv.{row.level}</span>
              <span style={{ fontSize: 12, color: 'var(--color-green)', fontWeight: 'bold' }}>+{perLevel}</span>
              <span style={{ fontSize: 11, color: 'var(--color-gold)', marginTop: 2 }}>{cost} 🪙</span>
            </button>
          );
        })}
      </div>

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

      {claimedReward && (
        <div className="modal-overlay" onClick={() => setClaimedReward(null)}>
          <div style={{
            background: '#1a1020', border: '2px solid #ffd700', borderRadius: 12,
            padding: 24, minWidth: 280, textAlign: 'center',
          }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>
              {REWARD_ICONS[claimedReward.rewardType] ?? '?'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ffd700', marginBottom: 8 }}>
              보상 수령!
            </div>
            <div style={{ fontSize: 16, marginBottom: 16 }}>
              {REWARD_LABELS[claimedReward.rewardType] ?? claimedReward.rewardType} {formatRewardAmount(claimedReward.rewardType, claimedReward.rewardAmount)}
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => { setClaimedReward(null); refresh(); }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
