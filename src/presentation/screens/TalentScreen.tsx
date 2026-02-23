import { useState, useRef, useEffect } from 'react';
import { useGame } from '../GameContext';
import { StatType, ResourceType, TalentGrade } from '../../domain/enums';
import { StatsDisplay } from '../components/StatsDisplay';
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

const STAT_LABELS: Record<string, string> = { ATK: '공격력', DEF: '방어력' };

function formatRewardAmount(type: MilestoneRewardType, amount: number): string {
  if (type === 'GOLD_BOOST') return `+${amount}%`;
  if (amount >= 10000) return `x${(amount / 1000).toFixed(1)}K`;
  if (amount >= 1000) return `x${amount.toLocaleString()}`;
  return `x${amount}`;
}

export function TalentScreen() {
  const { game, refresh } = useGame();
  const talent = game.player.talent;
  const stats = game.player.computeStats();
  const [claimedReward, setClaimedReward] = useState<TalentMilestone | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<TalentGrade>(talent.grade);
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalLevel = talent.getTotalLevel();
  const nextThreshold = talent.getNextGradeThreshold();
  const gradeOrder = TalentTable.getGradeOrder();
  const goldBoostPct = Math.round((game.player.getGoldMultiplier() - 1) * 100);

  const gradeStart = TalentTable.getGradeStartLevel(selectedGrade);
  const gradeEnd = TalentTable.getNextGradeThreshold(selectedGrade);
  const gradeRange = gradeEnd ? gradeEnd - gradeStart : 1;

  const milestones = TalentTable.getMilestonesInRange(gradeStart, gradeEnd ?? Infinity)
    .sort((a, b) => a.level - b.level);

  const progress = gradeEnd
    ? Math.min(Math.max((totalLevel - gradeStart) / gradeRange, 0), 1) * 100
    : 100;

  const nextGradeIdx = TalentTable.getGradeIndex(selectedGrade) + 1;
  const nextGradeBonus = nextGradeIdx < gradeOrder.length
    ? TalentTable.getIndividualGradeBonus(gradeOrder[nextGradeIdx])
    : null;

  useEffect(() => {
    if (!scrollRef.current || !gradeEnd) return;
    const el = scrollRef.current;
    if (el.scrollWidth <= el.clientWidth) return;
    const pct = Math.min(Math.max((totalLevel - gradeStart) / (gradeEnd - gradeStart), 0), 1);
    el.scrollLeft = Math.max(0, pct * el.scrollWidth - el.clientWidth / 2);
  }, [selectedGrade]);

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

  function hasUnclaimedInGrade(grade: TalentGrade): boolean {
    const start = TalentTable.getGradeStartLevel(grade);
    const end = TalentTable.getNextGradeThreshold(grade);
    if (!end) return false;
    return TalentTable.getMilestonesInRange(start, end).some(m =>
      totalLevel >= m.level && !game.player.claimedMilestones.has(`LV_${m.level}`),
    );
  }

  const rows = [
    { stat: StatType.ATK, label: '공격력', level: talent.atkLevel },
    { stat: StatType.HP, label: '체력', level: talent.hpLevel },
    { stat: StatType.DEF, label: '방어력', level: talent.defLevel },
  ];

  const trackMinWidth = milestones.length > 5 ? milestones.length * 48 + 40 : undefined;

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
        <div className="ms-tabs">
          {gradeOrder.map(g => (
            <button
              key={g}
              className={`ms-tab ${selectedGrade === g ? 'active' : ''}`}
              onClick={() => setSelectedGrade(g)}
            >
              {GRADE_LABELS[g]}
              {hasUnclaimedInGrade(g) && <span className="ms-dot" />}
            </button>
          ))}
        </div>

        {gradeEnd ? (
          <>
            <div className="ms-scroll" ref={scrollRef}>
              <div className="ms-track" style={{ minWidth: trackMinWidth }}>
                <div className="ms-markers">
                  {milestones.map(m => {
                    const pct = ((m.level - gradeStart) / gradeRange) * 100;
                    const reached = totalLevel >= m.level;
                    const key = talent.getMilestoneKey(m.level);
                    const claimed = game.player.claimedMilestones.has(key);
                    const state = claimed ? 'claimed' : reached ? 'claimable' : 'locked';

                    return (
                      <div key={m.level} className="ms-marker" style={{ left: `${pct}%` }}>
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
                  <span>Lv.{gradeStart}</span>
                  <span>Lv.{gradeEnd}</span>
                </div>
              </div>
            </div>
            {nextGradeBonus && (
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4, textAlign: 'center' }}>
                ⬆ {GRADE_LABELS[gradeOrder[nextGradeIdx]]} 승급 시: {STAT_LABELS[nextGradeBonus.stat]} +{nextGradeBonus.amount}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 16, color: 'var(--color-gold)', fontWeight: 'bold' }}>
            ⬆ 영웅 (최고 등급)
          </div>
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
