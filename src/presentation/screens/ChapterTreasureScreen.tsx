import { useGame } from '../GameContext';
import { ChapterTreasureTable } from '../../domain/data/ChapterTreasureTable';
import type { ChapterMilestone } from '../../domain/data/ChapterTreasureTable';
import { ArrowLeft } from 'lucide-react';
import { ResourceType } from '../../domain/enums';

const RESOURCE_LABELS: Partial<Record<ResourceType, string>> = {
  [ResourceType.GOLD]: 'G',
  [ResourceType.GEMS]: '보석',
  [ResourceType.EQUIPMENT_STONE]: '장비석',
  [ResourceType.POWER_STONE]: '파워스톤',
};

const RESOURCE_COLORS: Partial<Record<ResourceType, string>> = {
  [ResourceType.GOLD]: '#ffd700',
  [ResourceType.GEMS]: '#e040fb',
  [ResourceType.EQUIPMENT_STONE]: '#4fc3f7',
  [ResourceType.POWER_STONE]: '#ff7043',
};

function getAllMilestonesLinear(clearedChapterMax: number): ChapterMilestone[] {
  const chapterIds = ChapterTreasureTable.getAvailableChapterIds(clearedChapterMax);
  const all: ChapterMilestone[] = [];
  for (const id of chapterIds) {
    all.push(...ChapterTreasureTable.getMilestonesForChapter(id));
  }
  return all;
}

export function ChapterTreasureScreen() {
  const { game, refresh, setScreen } = useGame();

  const allMilestones = getAllMilestonesLinear(game.player.clearedChapterMax);
  const claimedCount = allMilestones.filter(m => game.player.claimedMilestones.has(m.id)).length;

  const currentMilestone = allMilestones.find(
    m => game.chapterTreasure.getMilestoneStatus(m, game.player) !== 'claimed',
  ) ?? null;

  const status = currentMilestone
    ? game.chapterTreasure.getMilestoneStatus(currentMilestone, game.player)
    : null;

  const bestDay = currentMilestone
    ? (game.player.bestSurvivalDays.get(currentMilestone.chapterId) ?? 0)
    : 0;
  const clearSentinel = currentMilestone
    ? ChapterTreasureTable.getClearSentinelDay(currentMilestone.chapterId)
    : 0;
  const isCleared = bestDay >= clearSentinel;

  function handleClaim() {
    if (!currentMilestone || status !== 'claimable') return;
    game.claimChapterTreasure(currentMilestone.id);
    game.saveGame();
    refresh();
  }

  function getConditionText(): string {
    if (!currentMilestone || !status) return '';
    if (currentMilestone.type === 'CLEAR') {
      return `챕터 ${currentMilestone.chapterId} 클리어 후 수령 가능`;
    }
    return `챕터 ${currentMilestone.chapterId}에서 ${currentMilestone.requiredDay}일 생존 후 수령 가능`;
  }

  function getBestDayDisplay(): string {
    if (!currentMilestone) return '';
    if (isCleared) return '클리어';
    if (bestDay === 0) return '기록 없음';
    return `${bestDay}일`;
  }

  return (
    <div className="screen">
      <div className="treasure-title-banner">
        <span>챕터 보물상자</span>
      </div>

      <div style={{ textAlign: 'center', margin: '12px 0 8px' }}>
        <div style={{ fontSize: 13, color: '#aaa', marginBottom: 4 }}>
          보상 진행도
        </div>
        <div className="progress-bar" style={{ height: 10 }}>
          <div
            className="progress-fill"
            style={{ width: `${allMilestones.length > 0 ? (claimedCount / allMilestones.length) * 100 : 0}%` }}
          />
        </div>
        <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
          {claimedCount} / {allMilestones.length}
        </div>
      </div>

      {currentMilestone && status ? (
        <>
          <div className="card" style={{ textAlign: 'center', marginTop: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 4 }}>
              챕터 {currentMilestone.chapterId} — {currentMilestone.label}
            </div>
            <div style={{ fontSize: 12, color: '#888' }}>
              최고 기록: {getBestDayDisplay()}
            </div>
          </div>

          <div className="treasure-reward-card">
            <div className="treasure-reward-title">보상</div>
            <div className="treasure-reward-grid">
              {currentMilestone.reward.resources.map((r, i) => (
                <div key={i} className="treasure-reward-item">
                  <div
                    className="treasure-reward-icon"
                    style={{ background: RESOURCE_COLORS[r.type] ?? '#888' }}
                  />
                  <div className="treasure-reward-info">
                    <div className="treasure-reward-amount">{r.amount.toLocaleString()}</div>
                    <div className="treasure-reward-name">{RESOURCE_LABELS[r.type] ?? r.type}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="treasure-condition">{getConditionText()}</div>

          {status === 'claimable' && (
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={handleClaim}>
              수령
            </button>
          )}
          {status === 'locked' && (
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 8 }} disabled>
              조건 미달성
            </button>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>
          모든 보상을 수령했습니다
        </div>
      )}

      <button
        className="btn btn-secondary"
        style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 4 }}
        onClick={() => setScreen('chapter')}
      >
        <ArrowLeft size={16} /> 뒤로가기
      </button>
    </div>
  );
}
