import { useState } from 'react';
import { useGame } from '../GameContext';
import { ResourceType } from '../../domain/enums';
import type { GameEvent, EventMission } from '../../domain/meta/GameEvent';

type QuestTab = 'daily' | 'weekly';

const RESOURCE_LABELS: Record<string, string> = {
  [ResourceType.GOLD]: '골드',
  [ResourceType.GEMS]: '보석',
  [ResourceType.EQUIPMENT_STONE]: '장비석',
  [ResourceType.POWER_STONE]: '파워스톤',
  [ResourceType.STAMINA]: '스태미나',
  [ResourceType.PET_EGG]: '펫 알',
  [ResourceType.PET_FOOD]: '사료',
};

export function QuestScreen() {
  const { game, refresh } = useGame();
  const [tab, setTab] = useState<QuestTab>('daily');

  const activeEvents = game.eventManager.getActiveEvents();
  const dailyEvent = activeEvents.find(e => e.id.startsWith('daily_'));
  const weeklyEvent = activeEvents.find(e => e.id.startsWith('weekly_'));

  function claimReward(event: GameEvent, missionId: string) {
    const reward = event.claimMissionReward(missionId);
    if (!reward) return;
    for (const r of reward.resources) {
      game.player.resources.add(r.type, r.amount);
    }
    game.saveGame();
    refresh();
  }

  function claimAll(event: GameEvent | undefined) {
    if (!event) return;
    for (const mission of event.missions) {
      if (mission.current >= mission.target && !mission.claimed) {
        const reward = event.claimMissionReward(mission.id);
        if (reward) {
          for (const r of reward.resources) {
            game.player.resources.add(r.type, r.amount);
          }
        }
      }
    }
    game.saveGame();
    refresh();
  }

  function getClaimableCount(event: GameEvent | undefined): number {
    if (!event) return 0;
    return event.missions.filter(m => m.current >= m.target && !m.claimed).length;
  }

  function renderMission(event: GameEvent, mission: EventMission) {
    const completed = mission.current >= mission.target;
    const progress = Math.min(mission.current / mission.target, 1);
    const rewardText = mission.reward.resources
      .map(r => `${RESOURCE_LABELS[r.type] ?? r.type} ${r.amount}`)
      .join(', ');

    return (
      <div
        className={`quest-card ${mission.claimed ? 'quest-claimed' : ''}`}
        key={mission.id}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: 13 }}>{mission.description}</div>
          <div className="progress-bar" style={{ margin: '6px 0' }}>
            <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: '#888' }}>{mission.current}/{mission.target}</span>
            <span className="quest-reward">{rewardText}</span>
          </div>
        </div>
        <div style={{ marginLeft: 8, flexShrink: 0 }}>
          {mission.claimed ? (
            <button className="btn btn-secondary" disabled>완료</button>
          ) : completed ? (
            <button className="btn btn-primary" onClick={() => claimReward(event, mission.id)}>
              수령
            </button>
          ) : (
            <button className="btn btn-secondary" disabled>진행 중</button>
          )}
        </div>
      </div>
    );
  }

  function renderEventSection(event: GameEvent | undefined, label: string) {
    if (!event) {
      return (
        <div className="card" style={{ textAlign: 'center', color: '#555', padding: 24 }}>
          {label}이 없습니다
        </div>
      );
    }

    const claimable = getClaimableCount(event);

    return (
      <>
        <div className="card">
          <div className="stat-row">
            <span>진행도</span>
            <span>{event.getCompletedMissionCount()}/{event.missions.length}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${event.getProgress() * 100}%` }} />
          </div>
        </div>

        {claimable > 0 && (
          <button
            className="btn btn-primary"
            style={{ width: '100%', margin: '8px 0' }}
            onClick={() => claimAll(event)}
          >
            전체 수령 ({claimable}개)
          </button>
        )}

        {event.missions.map(m => renderMission(event, m))}
      </>
    );
  }

  return (
    <div className="screen">
      <h2>퀘스트</h2>

      <div className="inv-filter-bar">
        <button
          className={`inv-filter-btn ${tab === 'daily' ? 'active' : ''}`}
          onClick={() => setTab('daily')}
        >
          일일
        </button>
        <button
          className={`inv-filter-btn ${tab === 'weekly' ? 'active' : ''}`}
          onClick={() => setTab('weekly')}
        >
          주간
        </button>
      </div>

      {tab === 'daily' && renderEventSection(dailyEvent, '일일 퀘스트')}
      {tab === 'weekly' && renderEventSection(weeklyEvent, '주간 퀘스트')}
    </div>
  );
}
