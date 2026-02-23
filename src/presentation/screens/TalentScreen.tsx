import { useState } from 'react';
import { useGame } from '../GameContext';
import { StatType, ResourceType, TalentGrade } from '../../domain/enums';
import { StatsDisplay } from '../components/StatsDisplay';
import { TalentTable } from '../../domain/data/TalentTable';
import type { TalentMilestone } from '../../domain/data/TalentTable';

const GRADE_LABELS: Record<TalentGrade, string> = {
  [TalentGrade.DISCIPLE]: '수련생',
  [TalentGrade.ADVENTURER]: '모험가',
  [TalentGrade.ELITE]: '정예',
  [TalentGrade.MASTER]: '달인',
  [TalentGrade.WARRIOR]: '전사',
  [TalentGrade.HERO]: '영웅',
};

const RESOURCE_ICONS: Partial<Record<ResourceType, string>> = {
  [ResourceType.GOLD]: '🪙',
  [ResourceType.GEMS]: '💎',
  [ResourceType.EQUIPMENT_STONE]: '⚒️',
  [ResourceType.POWER_STONE]: '⚡',
};

const RESOURCE_LABELS: Partial<Record<ResourceType, string>> = {
  [ResourceType.GOLD]: '골드',
  [ResourceType.GEMS]: '보석',
  [ResourceType.EQUIPMENT_STONE]: '장비석',
  [ResourceType.POWER_STONE]: '강화석',
};

function formatRewardAmount(type: ResourceType, amount: number): string {
  if (amount >= 10000) return `x${(amount / 1000).toFixed(1)}K`;
  if (amount >= 1000) return `x${amount.toLocaleString()}`;
  return `x${amount}`;
}

export function TalentScreen() {
  const { game, refresh } = useGame();
  const talent = game.player.talent;
  const stats = game.player.computeStats();
  const [claimedReward, setClaimedReward] = useState<TalentMilestone | null>(null);

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
    const key = talent.getMilestoneKey(milestone.fromGrade, milestone.percent);
    if (game.player.claimedMilestones.has(key)) return;
    game.player.claimedMilestones.add(key);
    game.player.resources.add(milestone.rewardType, milestone.rewardAmount);
    setClaimedReward(milestone);
    game.saveGame();
    refresh();
  }

  const rows = [
    { stat: StatType.ATK, label: '공격력', level: talent.atkLevel },
    { stat: StatType.HP, label: '체력', level: talent.hpLevel },
    { stat: StatType.DEF, label: '방어력', level: talent.defLevel },
  ];

  const nextThreshold = talent.getNextGradeThreshold();
  const gradeOrder = TalentTable.getGradeOrder();

  const activeGrade = talent.grade !== TalentGrade.HERO ? talent.grade : TalentGrade.WARRIOR;
  const activeMilestones = TalentTable.getMilestonesForGrade(activeGrade);
  const nextGradeIndex = TalentTable.getGradeIndex(activeGrade) + 1;
  const nextGradeName = nextGradeIndex < gradeOrder.length
    ? GRADE_LABELS[gradeOrder[nextGradeIndex]]
    : '';

  const gradeStart = TalentTable.getGradeStartLevel(activeGrade);
  const gradeEnd = TalentTable.getNextGradeThreshold(activeGrade) ?? gradeStart;
  const gradeRange = gradeEnd - gradeStart;
  const localProgress = gradeRange > 0
    ? Math.min(1, Math.max(0, (talent.getTotalLevel() - gradeStart) / gradeRange))
    : 1;

  const pastClaimable = talent.getClaimableMilestones(game.player.claimedMilestones)
    .filter(m => m.fromGrade !== activeGrade);

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
          <span>{talent.getTotalLevel()}{nextThreshold ? ` / ${nextThreshold}` : ''}</span>
        </div>

        <div className="ms-track">
          <div className="ms-markers">
            {activeMilestones.map(m => {
              const key = talent.getMilestoneKey(m.fromGrade, m.percent);
              const claimed = game.player.claimedMilestones.has(key);
              const reached = talent.isMilestoneReached(m.fromGrade, m.percent);
              const state = claimed ? 'claimed' : reached ? 'claimable' : 'locked';

              return (
                <div key={key} className="ms-marker" style={{ left: `${m.percent}%` }}>
                  <div
                    className={`ms-icon ${state}`}
                    onClick={state === 'claimable' ? () => claimMilestone(m) : undefined}
                  >
                    <span>{RESOURCE_ICONS[m.rewardType] ?? '?'}</span>
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
            <div className="ms-fill" style={{ width: `${localProgress * 100}%` }} />
          </div>
          <div className="ms-labels">
            <span>{GRADE_LABELS[activeGrade]}</span>
            <span>{nextGradeName}</span>
          </div>
        </div>
      </div>

      {pastClaimable.length > 0 && (
        <div className="card" style={{ marginTop: 8 }}>
          <div style={{ fontSize: 13, color: '#ffd700', marginBottom: 8 }}>미수령 보상</div>
          {pastClaimable.map(m => {
            const key = talent.getMilestoneKey(m.fromGrade, m.percent);
            return (
              <div key={key} className="talent-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{RESOURCE_ICONS[m.rewardType] ?? '?'}</span>
                  <div>
                    <div style={{ fontSize: 13 }}>{GRADE_LABELS[m.fromGrade]} {m.percent}%</div>
                    <div style={{ fontSize: 12, color: '#aaa' }}>
                      {RESOURCE_LABELS[m.rewardType] ?? m.rewardType} {formatRewardAmount(m.rewardType, m.rewardAmount)}
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={() => claimMilestone(m)}>수령</button>
              </div>
            );
          })}
        </div>
      )}

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
              {RESOURCE_ICONS[claimedReward.rewardType] ?? '?'}
            </div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ffd700', marginBottom: 8 }}>
              보상 수령!
            </div>
            <div style={{ fontSize: 16, marginBottom: 16 }}>
              {RESOURCE_LABELS[claimedReward.rewardType] ?? claimedReward.rewardType} {formatRewardAmount(claimedReward.rewardType, claimedReward.rewardAmount)}
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
