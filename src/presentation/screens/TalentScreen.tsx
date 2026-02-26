import { useState, useMemo } from 'react';
import { useGame } from '../GameContext';
import { StatType, ResourceType } from '../../domain/enums';
import { TalentTable, GRADE_LABELS } from '../../domain/data/TalentTable';
import type { TalentMilestone, MilestoneRewardType, TransitionInfo } from '../../domain/data/TalentTable';

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

const BONUS_STAT_LABELS: Record<string, string> = {
  ATK: '공격력',
  DEF: '방어력',
};

const VIEW_RANGE = 15;
const MAX_LEVEL = TalentTable.getMaxLevel();

function formatRewardAmount(type: MilestoneRewardType, amount: number): string {
  if (type === 'GOLD_BOOST') return `+${amount}%`;
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 10_000) return `${(amount / 1_000).toFixed(1)}K`;
  return `${amount.toLocaleString()}`;
}

type TrackNode =
  | { type: 'reward'; level: number; milestone: TalentMilestone }
  | { type: 'transition'; level: number; transition: TransitionInfo };

function buildAllNodes(): TrackNode[] {
  const nodes: TrackNode[] = [];
  for (const m of TalentTable.getAllMilestones()) {
    nodes.push({ type: 'reward', level: m.level, milestone: m });
  }
  for (const t of TalentTable.getAllTransitions()) {
    nodes.push({ type: 'transition', level: t.level, transition: t });
  }
  nodes.sort((a, b) => a.level - b.level);
  return nodes;
}

const ALL_NODES = buildAllNodes();

export function TalentScreen() {
  const { game, refresh } = useGame();
  const talent = game.player.talent;
  const [claimedReward, setClaimedReward] = useState<TalentMilestone | null>(null);

  const totalLevel = talent.getTotalLevel();
  const subGradeInfo = TalentTable.getSubGradeInfo(totalLevel);
  const nextThreshold = talent.getNextGradeThreshold();
  const goldBoostPct = Math.round((game.player.getGoldMultiplier() - 1) * 100);
  const levelsPerStat = TalentTable.getLevelsPerStat();

  const subGradeProgress = subGradeInfo.tierLevels > 0
    ? Math.min(subGradeInfo.levelInTier / subGradeInfo.tierLevels, 1) * 100
    : 100;

  let viewStart = Math.max(0, totalLevel - Math.floor(VIEW_RANGE / 2));
  let viewEnd = viewStart + VIEW_RANGE;
  if (viewEnd > MAX_LEVEL) {
    viewEnd = MAX_LEVEL;
    viewStart = Math.max(0, viewEnd - VIEW_RANGE);
  }
  const viewSize = viewEnd - viewStart;

  const visibleNodes = useMemo(() =>
    ALL_NODES.filter(n => n.level >= viewStart && n.level <= viewEnd),
    [viewStart, viewEnd],
  );

  const allClaimable = talent.getClaimableMilestones(game.player.claimedMilestones);

  function upgradeStat(stat: StatType) {
    if (!talent.canUpgradeStat(stat)) return;
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

  function claimAll() {
    const claimable = talent.getClaimableMilestones(game.player.claimedMilestones);
    if (claimable.length === 0) return;
    for (const m of claimable) {
      game.player.claimedMilestones.add(talent.getMilestoneKey(m.level));
      if (m.rewardType !== 'GOLD_BOOST') {
        game.player.resources.add(m.rewardType, m.rewardAmount);
      }
    }
    game.saveGame();
    refresh();
  }

  const rows = [
    { stat: StatType.ATK, label: '공격력' },
    { stat: StatType.HP, label: '체력' },
    { stat: StatType.DEF, label: '방어력' },
  ];

  const fillPct = viewSize > 0
    ? Math.min(Math.max((totalLevel - viewStart) / viewSize, 0), 1) * 100
    : 0;

  return (
    <div className="screen">
      <h2>재능</h2>

      <div className="card">
        <div className="stat-row">
          <span>등급</span>
          <span>{TalentTable.getSubGradeLabel(totalLevel)}</span>
        </div>
        <div className="stat-row">
          <span>서브 등급 진행</span>
          <span>{subGradeInfo.levelInTier} / {subGradeInfo.tierLevels > 0 ? subGradeInfo.tierLevels : '-'}</span>
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
        <div style={{ marginTop: 6 }}>
          <div className="ms-bar" style={{ height: 6, borderRadius: 3 }}>
            <div className="ms-fill" style={{ width: `${subGradeProgress}%`, borderRadius: 3 }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 8 }}>
        <h3>등급 보상</h3>
        <div className="ms-track" style={{ position: 'relative', paddingTop: 32, paddingBottom: 16 }}>
          <div className="ms-markers">
            {visibleNodes.map(node => {
              const pct = viewSize > 0 ? ((node.level - viewStart) / viewSize) * 100 : 0;
              const reached = totalLevel >= node.level;

              if (node.type === 'transition') {
                const t = node.transition;
                const iconClass = t.isMainGrade ? 'grade-up' : 'tier-up';
                const label = t.isMainGrade
                  ? GRADE_LABELS[t.grade]
                  : `${BONUS_STAT_LABELS[t.bonus.stat] ?? t.bonus.stat}+${t.bonus.amount}`;

                return (
                  <div key={`t_${node.level}`} className="ms-marker" style={{ left: `${pct}%` }}>
                    <div className={`ms-icon ${iconClass} ${reached ? 'reached' : 'locked'}`}>
                      {t.isMainGrade ? '⭐' : '⬆'}
                    </div>
                    <div className={`ms-amount ${reached ? '' : 'locked'}`}>{label}</div>
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
            <div className="ms-fill" style={{ width: `${fillPct}%` }} />
          </div>
          <div className="ms-labels">
            <span>Lv.{viewStart}</span>
            <span>Lv.{viewEnd}</span>
          </div>
        </div>
        {allClaimable.length > 0 && (
          <div className="stat-row" style={{ marginTop: 4 }}>
            <span style={{ color: 'var(--color-gold)', fontSize: 12 }}>미수령 보상: {allClaimable.length}개</span>
            <button
              className="btn btn-primary"
              style={{ fontSize: 11, padding: '2px 10px' }}
              onClick={claimAll}
            >
              모두 수령
            </button>
          </div>
        )}
      </div>

      <div className="talent-upgrades">
        {rows.map(row => {
          const tierLevel = talent.getStatLevelInTier(row.stat);
          const atMax = !talent.canUpgradeStat(row.stat);
          const cost = talent.getUpgradeCost(row.stat);
          const canAfford = game.player.resources.canAfford(ResourceType.GOLD, cost);
          const perLevel = TalentTable.getStatPerLevel(row.stat);

          return (
            <button
              key={row.stat}
              className="talent-btn"
              disabled={atMax || !canAfford}
              onClick={() => upgradeStat(row.stat)}
            >
              <span style={{ fontSize: 24 }}>{STAT_ICONS[row.stat]}</span>
              <span style={{ fontWeight: 'bold', fontSize: 13 }}>{row.label}</span>
              <span style={{ fontSize: 11, color: atMax ? '#4a4' : '#888' }}>
                Lv.{tierLevel} / {levelsPerStat}
              </span>
              <span style={{ fontSize: 12, color: 'var(--color-green)', fontWeight: 'bold' }}>+{perLevel}</span>
              <span style={{ fontSize: 11, color: 'var(--color-gold)', marginTop: 2 }}>
                {atMax ? 'MAX' : `${cost.toLocaleString()} 🪙`}
              </span>
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
