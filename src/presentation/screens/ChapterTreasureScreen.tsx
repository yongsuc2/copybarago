import { useState } from 'react';
import { useGame } from '../GameContext';
import { ChapterTreasureTable } from '../../domain/data/ChapterTreasureTable';
import { ArrowLeft, Check, Lock, Gift } from 'lucide-react';
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

export function ChapterTreasureScreen() {
  const { game, refresh, setScreen } = useGame();
  const chapterIds = ChapterTreasureTable.getAvailableChapterIds(game.player.clearedChapterMax);
  const [selectedChapterId, setSelectedChapterId] = useState(
    () => Math.max(1, game.player.clearedChapterMax + 1),
  );
  const [selectedMilestoneIdx, setSelectedMilestoneIdx] = useState(0);

  const milestones = ChapterTreasureTable.getMilestonesForChapter(selectedChapterId);
  const currentMilestone = milestones[selectedMilestoneIdx];

  const status = currentMilestone
    ? game.chapterTreasure.getMilestoneStatus(currentMilestone, game.player)
    : 'locked';

  const bestDay = game.player.bestSurvivalDays.get(selectedChapterId) ?? 0;
  const clearSentinel = ChapterTreasureTable.getClearSentinelDay(selectedChapterId);
  const isCleared = bestDay >= clearSentinel;

  function handleClaim() {
    if (!currentMilestone || status !== 'claimable') return;
    game.claimChapterTreasure(currentMilestone.id);
    refresh();
  }

  function handleSelectChapter(id: number) {
    setSelectedChapterId(id);
    setSelectedMilestoneIdx(0);
  }

  function getConditionText(): string {
    if (!currentMilestone) return '';
    if (status === 'claimed') return '수령 완료';
    if (currentMilestone.type === 'CLEAR') {
      return `챕터${selectedChapterId} 클리어 후 수령 가능`;
    }
    return `챕터${selectedChapterId}에서 ${currentMilestone.requiredDay}일 생존 후 수령 가능`;
  }

  function getBestDayDisplay(): string {
    if (isCleared) return '클리어';
    if (bestDay === 0) return '기록 없음';
    return `${bestDay}일`;
  }

  return (
    <div className="screen">
      <div className="treasure-title-banner">
        <span>챕터 보물상자</span>
      </div>

      <div className="treasure-best-day">
        최고 기록: {getBestDayDisplay()}
      </div>

      <div className="treasure-chapter-selector">
        {chapterIds.map(id => (
          <button
            key={id}
            className={`treasure-chapter-pill ${id === selectedChapterId ? 'active' : ''}`}
            onClick={() => handleSelectChapter(id)}
          >
            Ch.{id}
          </button>
        ))}
      </div>

      <div className="treasure-banner-scroll">
        {milestones.map((m, i) => {
          const mStatus = game.chapterTreasure.getMilestoneStatus(m, game.player);
          return (
            <div
              key={m.id}
              className={`treasure-banner ${mStatus} ${i === selectedMilestoneIdx ? 'selected' : ''}`}
              onClick={() => setSelectedMilestoneIdx(i)}
            >
              <div className="treasure-banner-icon">
                {mStatus === 'claimed' && <Check size={20} />}
                {mStatus === 'locked' && <Lock size={20} />}
                {mStatus === 'claimable' && <Gift size={20} />}
              </div>
              <div className="treasure-banner-label">{m.label}</div>
              <div className="treasure-banner-chapter">챕터{m.chapterId}</div>
            </div>
          );
        })}
      </div>

      {currentMilestone && (
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
      )}

      <div className="treasure-condition">{getConditionText()}</div>

      {currentMilestone && status === 'claimable' && (
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={handleClaim}>
          수령
        </button>
      )}
      {currentMilestone && status === 'claimed' && (
        <button className="btn btn-secondary" style={{ width: '100%', marginTop: 8 }} disabled>
          수령 완료
        </button>
      )}
      {currentMilestone && status === 'locked' && (
        <button className="btn btn-secondary" style={{ width: '100%', marginTop: 8 }} disabled>
          조건 미달성
        </button>
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
