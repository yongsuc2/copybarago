import { useState } from 'react';
import { useGame } from '../GameContext';
import { StatType, ResourceType, TalentGrade } from '../../domain/enums';
import { StatsDisplay } from '../components/StatsDisplay';
import { TalentTable } from '../../domain/data/TalentTable';
import type { TalentGradeReward } from '../../domain/data/TalentTable';

const GRADE_LABELS: Record<TalentGrade, string> = {
  [TalentGrade.DISCIPLE]: '수련생',
  [TalentGrade.ADVENTURER]: '모험가',
  [TalentGrade.ELITE]: '정예',
  [TalentGrade.MASTER]: '달인',
  [TalentGrade.WARRIOR]: '전사',
  [TalentGrade.HERO]: '영웅',
};

export function TalentScreen() {
  const { game, refresh } = useGame();
  const talent = game.player.talent;
  const stats = game.player.computeStats();
  const [gradeUpReward, setGradeUpReward] = useState<{ grade: TalentGrade; reward: TalentGradeReward } | null>(null);

  function upgradeStat(stat: StatType) {
    const cost = talent.getUpgradeCost(stat);
    if (!game.player.resources.canAfford(ResourceType.GOLD, cost)) return;

    const result = talent.upgrade(stat, game.player.resources.gold);
    if (result.isOk() && result.data) {
      game.player.resources.spend(ResourceType.GOLD, result.data.cost);

      if (result.data.gradeChanged) {
        const reward = TalentTable.getGradeReward(talent.grade);
        if (reward) {
          setGradeUpReward({ grade: talent.grade, reward });
        }
      }

      game.saveGame();
    }
    refresh();
  }

  const rows = [
    { stat: StatType.ATK, label: '공격력', level: talent.atkLevel },
    { stat: StatType.HP, label: '체력', level: talent.hpLevel },
    { stat: StatType.DEF, label: '방어력', level: talent.defLevel },
  ];

  const nextThreshold = talent.getNextGradeThreshold();

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
          <span>{talent.getTotalLevel()}</span>
        </div>
        {nextThreshold && (
          <>
            <div className="stat-row">
              <span>다음 등급</span>
              <span>{talent.getTotalLevel()} / {nextThreshold}</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(talent.getTotalLevel() / nextThreshold) * 100}%` }} />
            </div>
          </>
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

      {gradeUpReward && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
        }}>
          <div style={{
            background: '#1a1020', border: '2px solid #ffd700', borderRadius: 12,
            padding: 24, minWidth: 280, textAlign: 'center',
          }}>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#ffd700', marginBottom: 16 }}>
              등급 승급!
            </div>
            <div style={{ fontSize: 16, marginBottom: 16 }}>
              {GRADE_LABELS[gradeUpReward.grade] ?? gradeUpReward.grade}
            </div>
            <div style={{ fontSize: 13, color: '#ccc', marginBottom: 16, lineHeight: 1.8 }}>
              {gradeUpReward.reward.atkPercent > 0 && <div>공격력 +{(gradeUpReward.reward.atkPercent * 100).toFixed(0)}%</div>}
              {gradeUpReward.reward.defPercent > 0 && <div>방어력 +{(gradeUpReward.reward.defPercent * 100).toFixed(0)}%</div>}
              {gradeUpReward.reward.hpPercent > 0 && <div>체력 +{(gradeUpReward.reward.hpPercent * 100).toFixed(0)}%</div>}
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => { setGradeUpReward(null); refresh(); }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
